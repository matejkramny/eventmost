from fabric.api import run
from fabric.operations import put, get
import os

def getCard(id):
    # Get CWD
    path = os.path.dirname(os.path.realpath(__file__))
    # Upload .html file from the user
    put(path+'/../data/cardhtml/'+id+'.html', '~/'+id+'.html')
    # Take a screenshot of the business card
    run("webkit2png -o ~/" + id + ".png -x 500 250 "+id+".html")
    # Retrieve the business card .png
    get(id+'.png', path+'/../public/businesscards/'+id+'.png')
    # delete the .html and .png
    run("rm -f "+id+".png "+id+".html")