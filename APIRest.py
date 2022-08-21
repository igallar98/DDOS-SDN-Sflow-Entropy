#!/usr/bin/env python
from flask import Flask, render_template
from waitress import serve
from entropySflow import *

import os

app = Flask(__name__,template_folder='')
class APIRest:

    def __init__(self):
        self.blockList = {}


    def start(self, ipp, portp):
        serve(app, host=ipp, port=portp)

    @app.route('/', methods=['GET'])
    def index():
        f = open("index.html", "r")
        return f.read()

    def updateBlockList(self, bk):
        self.blockList = bk
