import sys
import json



fileName = sys.argv[1]

array = []
for i in range(1, 101):
    nome = "img" + str(i)
    array.append(nome)
print(json.dumps(array))

#nome = sys.argv[1] + sys.argv[2]
#nome.replace("\\", "")
#print(nome, end="")
