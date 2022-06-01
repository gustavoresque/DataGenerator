import sys
import json



fileName = sys.argv[1]
array = []
nomes = sys.argv[2].split(',')

for nome in nomes:
    array.append(nome)
print(json.dumps(array))

#output_name = sys.argv[1] + sys.argv[2]
#output_name.replace("\\", "")
#print(output_name, end="")

#output_name = "img" + sys.argv[2]
#output_name.replace("\\", "")
#print(output_name, end="")
#print(sys.argv[2], end="")