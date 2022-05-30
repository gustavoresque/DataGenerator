import sys
import json



fileName = sys.argv[1]

#array = []
#for i in range(1, 101):
    #nome = "img" + str(i)
    #array.append(nome)
#print(json.dumps(array))

#output_name = sys.argv[1] + sys.argv[2]
#output_name.replace("\\", "")
#print(output_name, end="")

output_name = "img" + sys.argv[2]
output_name.replace("\\", "")
print(output_name, end="")
