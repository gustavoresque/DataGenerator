# -*- coding: utf-8 -*-
"""
Created on Thu Dec  9 15:12:13 2021

@author: Rafael Rocha
"""

import time
from utils.azulejoGenerator import single_mosaic
import sys

fileName = sys.argv[1]
output_name = "img" + sys.argv[2]
output_name.replace("\\", "")
#start_time = time.time()
single_mosaic(fileName, output_name)
#t = time.time() - start_time

#print('Tempo de execução (s):', t)