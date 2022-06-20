# -*- coding: utf-8 -*-
"""
Created on Thu Dec  9 15:31:04 2021

@author: Rafael Rocha
"""

import time
from utils.azulejoGenerator import multiple_mosaics
import sys
import os

file_path = sys.argv[1]
name = sys.argv[2]
nFilesArray = sys.argv[3].split(',')

start_time = time.time()
multiple_mosaics(path_file = file_path, 
	file_name = name, n_images=len(nFilesArray))
t = time.time() - start_time

print('Tempo de execução (s):', t)
