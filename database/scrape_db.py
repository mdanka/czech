# -*- coding: utf-8 -*-

from lxml import html
import requests
import string
import sys

WIKTIONARY_WORD_LIST_BASE_URL = "https://cs.wiktionary.org/w/index.php?title=Kategorie:Česká_substantiva&from="

def getPage(fullUrl):
    try:
        r = requests.get(fullUrl, verify=False)
        return r.content
    # except requests.ConnectionError as e:
    #     return e.reason
    except requests.exceptions.RequestException as e:  # This is the correct syntax
        print(e)
        sys.exit(1)

def getWordsForLetter(letter):
    fullUrl = WIKTIONARY_WORD_LIST_BASE_URL + letter
    pageContent = getPage(fullUrl)
    tree = html.fromstring(pageContent)
    words = tree.xpath('//*[@id="mw-pages"]/div/div/div/ul/li/a/text()')
    return words

def getAllWords():
    wordsListList = map(getWordsForLetter, list(string.ascii_lowercase))
    wordsList = [item for sublist in wordsListList for item in sublist]
    return wordsList

def main():
    print(getAllWords())

if __name__ == "__main__":
    main()
