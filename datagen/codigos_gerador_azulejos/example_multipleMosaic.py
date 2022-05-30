# -*- coding: utf-8 -*-
"""
Created on Thu Dec  9 15:31:04 2021

@author: Rafael Rocha
"""

import time
from utils.azulejoGenerator import multiple_mosaics

start_time = time.time()
multiple_mosaics(input_dir='codigos_gerador_azulejos/input', n_images=2)
t = time.time() - start_time

print('Tempo de execução (s):', t)