# -*- coding: utf-8 -*-
"""
Created on Tue Dec  7 22:12:48 2021

@author: Rafael Rocha
"""

#%% Bibliotecas utilizadas
import numpy as np
import os
import cv2
from glob import glob
from itertools import permutations
import random
import imgaug.augmenters as iaa

#%% Funções
def resizeAndPad(img, size, padColor=0):
    h, w = img.shape[:2]
    sh, sw = size

    # interpolation method
    if h > sh or w > sw:  # shrinking image
        interp = cv2.INTER_AREA

    else:  # stretching image
        interp = cv2.INTER_CUBIC

    # aspect ratio of image
    aspect = float(w) / h
    saspect = float(sw) / sh

    if (saspect > aspect) or aspect <= 1:  # new horizontal image
        new_h = sh
        new_w = np.round(new_h * aspect).astype(int)
        pad_horz = float(sw - new_w) / 2
        pad_left, pad_right = np.floor(pad_horz).astype(int), np.ceil(pad_horz).astype(int)
        pad_top, pad_bot = 0, 0

    elif (saspect < aspect) or aspect >= 1:  # new vertical image
        new_w = sw
        new_h = np.round(float(new_w) / aspect).astype(int)
        pad_vert = float(sh - new_h) / 2
        pad_top, pad_bot = np.floor(pad_vert).astype(int), np.ceil(pad_vert).astype(int)
        pad_left, pad_right = 0, 0

    # set pad color
    if len(img.shape) == 3 and not isinstance(padColor,
                                              (list, tuple, np.ndarray)):  # color image but only one color provided
        padColor = [padColor] * 3

    # scale and pad
    #print(saspect, aspect)
    scaled_img = cv2.resize(img, (new_w, new_h), interpolation=interp)
    scaled_img = cv2.copyMakeBorder(scaled_img, pad_top, pad_bot, pad_left, pad_right, borderType=cv2.BORDER_CONSTANT,
                                    value=padColor)

    return scaled_img

def adjust_image_numbering(i):
    
    if i<10:
        j='00'+str(i)
    elif i>9 and i<100:
        j='0'+str(i)
    else:
        j=str(i)
    
    return j

def perspective(img):
    
    scale = (0.05, 0.15)
    
    aug = iaa.PerspectiveTransform(scale=scale)
    img_perspective = aug.augment_image(img)
    
    return img_perspective

def shadow_options(option, width, height):
    
    if option == 1:
        w_val = np.random.randint((width+1)*1/3, (width+1)*2/3, 2)
        h_val = np.random.randint((height+1)*1/3, (height+1)*2/3, 2)
        points = np.array([[ [0, 0], [0, h_val[0]], [w_val[1], h_val[1]], [w_val[1], 0] ]])
        
    elif option == 2:
        w_val = np.random.randint((width+1)/3, width+1, 2)
        h_val = np.random.randint((height+1)/3, height+1, 2)
        points = np.array([[ [width, 0], [w_val[0], 0], [w_val[1], h_val[0]], [width, h_val[0]] ]])
        
    elif option == 3:
        w_val = np.random.randint((width+1)/3, width+1, 2)
        h_val = np.random.randint((height+1)/3, height+1, 2)
        points = np.array([[ [width, height], [width, h_val[0]], [w_val[1], h_val[1]], [w_val[1], height] ]])
    elif option == 4:
        w_val = np.random.randint((width+1)/3, (width+1)*2/3, 2)
        h_val = np.random.randint((height+1)*2/3, height+1, 2)
        points = np.array([[ [0, height], [w_val[0], height], [w_val[0], h_val[0]], [0, h_val[1]] ]])
    
    return points

def make_shadow(img):
    
    height = img.shape[0]
    width = img.shape[1]
    
    mask = np.zeros((height, width), dtype=np.uint8)
    
    option = np.random.randint(1, 5)
    points = shadow_options(option, width, height)
    
    polygon = cv2.fillPoly(mask, points, (255))
    
    alpha_array = np.linspace(0.85, 0.95, 10) # 0.75, 0.95, 3
    alpha = np.random.choice(alpha_array)

    beta = 1
    
    img_corrected = img.copy()
    
    c = polygon == 255
    img_corrected[c,0] = (alpha*img[c,0]) + beta
    img_corrected[c,1] = (alpha*img[c,1]) + beta
    img_corrected[c,2] = (alpha*img[c,2]) + beta
    
    return img_corrected

def linear_contrast(img, alpha=(0.75, 1.25)):
    
    aug = iaa.LinearContrast(alpha=alpha)
    img_contrast = aug.augment_image(img)
    
    return img_contrast

def gamma_contrast(img, gamma=(0.5, 1.5)):
    
    aug = iaa.GammaContrast(gamma=gamma)
    img_gamma = aug.augment_image(img)
    
    return img_gamma

def rescale_image(image, shape, max_dim = 1024):
    
    #max_dim = 1024

    long_dim = max(shape)
    scale = max_dim/long_dim

    w = int(shape[1]*scale)
    h = int(shape[0]*scale)

    new_shape = (w, h)

    rescaled_image = cv2.resize(image, new_shape)
    
    return rescaled_image

def flip_noise(img):

    seq = iaa.Sequential([
        iaa.Fliplr(0.5),
        iaa.Flipud(0.5),
        iaa.AdditiveGaussianNoise(scale=(0, 0.05*255), per_channel=False) # Original: scale=(0, 0.2*255)
    ])

    img_aug = seq(image=img)
    
    return img_aug

def augmentation(img, add=(-10,10)):

    seq = iaa.Sequential([
        iaa.Fliplr(0.5),
        iaa.Flipud(0.5),
        iaa.AdditiveGaussianNoise(scale=(0, 0.05*255), per_channel=False), # Original: scale=(0, 0.2*255)
        iaa.AddToBrightness(add=add)
    ])

    img_aug = seq(image=img)
    
    return img_aug

def make_crack(img, file_path, input_dir = 'images/cracks/', file_prefix = '*.png', p=5):
    
    if np.random.rand() > (p/100):
        return img
    
    input_dir = os.path.join(file_path, input_dir)
    image_name_list =  glob(os.path.join(input_dir, file_prefix))
    mask_name = np.random.choice(image_name_list)
    
    mask = cv2.imread(mask_name, 0)
    
    img_crack = img.copy()

    height = img.shape[0]
    weight = img.shape[1]

    rescaled_mask = cv2.resize(mask, (weight, height))
    
    aug = iaa.AdditiveGaussianNoise(scale=(0, 0.15*255), per_channel=False)
    rescaled_mask_noise = aug.augment_image(rescaled_mask)

    c = rescaled_mask != 0
    img_crack[c,0] = rescaled_mask_noise[c]
    img_crack[c,1] = rescaled_mask_noise[c]
    img_crack[c,2] = rescaled_mask_noise[c]

    
    return img_crack

def collage_function(image_name, path_file_root, collage_size, p=10):
    
    """A função cria o mosaico de azulejos 
    
    Argumentos:
        image_name {string}: Imagem de entrada.
        collage_size {tupla}: Tamanho do mosaico.
        p {int}: Chance do azulejo ter rachadura.
    
    """
    image = cv2.imread(image_name, 1)

    r, c = collage_size

    images_outers = []

    for i in range(r):
        images = []
        for j in range(c):
            
            # Adiciona a rachadura ao azulejo de acordo com a chance p
            image_crack = make_crack(image, path_file_root, p=p)
    
            # Adiciona giros horizontais e verticais ao azulejo,
            # ruído gaussiano (média zero e desvio padrão na faixa de 0 a 0.05)
            # e brilho (faixa de -10 a 10 pixels).
            image_aug = augmentation(image_crack)
            
            images.append(image_aug)

        image_outer = np.hstack(images)
        images_outers.append(image_outer)

    image_collage = np.vstack(images_outers)
    
    return image_collage

def single_mosaic(path_file = '', file_name = '', img_number = '', output_dir = 'output',
                  min_size = 1, max_size = 10, img_size = 256, p = 5):
    
    """A função gera um único mosaico de um azulejo 
    
    Argumentos:
        image_name {string}: Imagem de entrada.
        output_name {string}: Imagem de saída.
        min_size {int}: Tamanho mínimo do mosaico.
        max_size {int}: Tamanho máximo do mosaico.
        img_size {int}: Tamanho da imagem de saída.
        p {int}: Chance do azulejo ter rachadura.
    
    """  
    path_file = path_file.replace("/", "\\")
    file_path_array = os.path.split(path_file)
    file_path_input_array = os.path.split(file_path_array[0])
    file_path_root = file_path_input_array[0]
    output_dir = os.path.join(file_path_root, output_dir)

    if not os.path.exists(output_dir):
        os.mkdir(output_dir)

    size = np.random.randint(min_size, max_size+1, 2)
    collage_size = (size[0], size[1])
    
    # Criação do mosaico (ver mais dentro da própria função)
    image_collage = collage_function(path_file, file_path_root, collage_size, p=p)
    
    # Adiciona contraste gamma (faixo do expoente de
    # ajuste de contraste variando entre 0.5 e 1.5)
    image_collage = gamma_contrast(image_collage)
    
    # Adiciona sombras aleatórias ao mosaico
    image_collage = make_shadow(image_collage)
    
    # Aplica transformação em perspectica ao mosaico, 
    # desvio padrão variando entre 0.05 e 0.15
    image_collage = perspective(image_collage)
    
    # Adiciona padding (zeros nas bordas da imagem) para deixar a
    # imagem ajustada corretamente para a resolução desejada
    image_collage = resizeAndPad(image_collage, (img_size, img_size))

    j = adjust_image_numbering(img_number)

    output_image_name = file_name + j + '.jpg'
    output_name = os.path.join(output_dir, output_image_name)
    cv2.imwrite(output_name, image_collage)

    return output_image_name
    
    
def multiple_mosaics(path_file = '', input_dir = 'input', output_dir = 'output',
                     file_prefix = '*.png', min_size = 1, max_size = 10,
                     file_name = 'img', n_images = 5, img_size = 256, p = 5):

    """A função gera mosaicos de azulejos por classe 
    
    Argumentos:
        input_dir {string}: Diretório de entrada
        output_dir {string}: Diretório de saída
        file_prefx {string}: Prefixo das imagens no diretório de entrada.
        min_size {int}: Tamnho miníno do mosaico.
        max_size {int}: Tamnanho máximo do mosaico.
        n_images {int}: Número de imagens.
        img_size {int}: Tamanho da imagem de saída.
        p {int}: Chance do azulejo ter rachadura.
    
    """
    path_file = path_file.replace("/", "\\")
    file_path = os.path.split(path_file)
    input_dir = os.path.join(file_path[0], input_dir)
    output_dir = os.path.join(file_path[0], output_dir)
    
    if not os.path.exists(output_dir):
        os.mkdir(output_dir)
    
    image_name_list = glob(os.path.join(input_dir, file_prefix))

    num = 0
    for image_name in image_name_list:
        #os.chdir(input_dir)
        dir_name = str(num)
        #print(image_name[len(input_dir)+1:-4])
        output_subdir = os.path.join(output_dir, dir_name)
        
        if not os.path.exists(output_subdir):
            os.mkdir(output_subdir)
        
        i=1
        for n in range(n_images):
            
            # Tamanho do moisaico aleatório
            size = np.random.randint(min_size, max_size+1, 2)
            collage_size = (size[0], size[1])
        
            # Criação do mosaico (ver mais dentro da própria função)
            image_collage = collage_function(file_path, image_name, collage_size, p=p)
            
            # Adiciona contraste gamma (faixo do expoente de
            # ajuste de contraste variando entre 0.5 e 1.5)
            image_collage = gamma_contrast(image_collage)

            # Adiciona sombras aleatórias ao mosaico
            image_collage = make_shadow(image_collage)
            
            # Aplica transformação em perspectica ao mosaico, 
            # desvio padrão variando entre 0.05 e 0.15
            image_collage = perspective(image_collage)
            
            # Adiciona padding (zeros nas bordas da imagem) para deixar a
            # imagem ajustada corretamente para a resolução desejada
            image_collage = resizeAndPad(image_collage, (img_size, img_size))
            
            j = adjust_image_numbering(i)
             
            output_image_name = file_name + j + '.jpg'
            output_name = os.path.join(output_subdir, output_image_name)
            cv2.imwrite(output_name, image_collage)
            i+=1
        
        num+=1