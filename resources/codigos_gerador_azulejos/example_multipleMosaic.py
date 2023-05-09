# -*- coding: utf-8 -*-
"""
Created on Thu Dec  9 15:31:04 2021

@author: Rafael Rocha
"""

import time
from utils.azulejoGenerator import multiple_mosaics
import sys
import json

array = []
file_path = sys.argv[1]
file_name = sys.argv[2].split(',')

array = multiple_mosaics(file_path, file_name)
print(json.dumps(array))

"""start_time = time.time()
multiple_mosaics(path_file = file_path, 
	file_name = name, n_images=len(nFilesArray))
t = time.time() - start_time

print('Tempo de execução (s):', t)"""
