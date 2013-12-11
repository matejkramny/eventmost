from fabric.api import run
from fabric.operations import put, get
import os

def getCard(id):
    path = os.path.dirname(os.path.realpath(__file__))
    put(path+'/../data/cardhtml/'+id+'.html', '~/'+id+'.html')
    run("webkit2png -o ~/" + id + ".png -x 500 250 "+id+".html")
    get(id+'.png', path+'/../public/businesscards/'+id+'.png')
    run("rm -rf "+id+".*")