# -*- coding: utf-8 -*-

from lxml import html
import requests
import string
import sys

WIKTIONARY_WORD_LIST_BASE_URL = "https://cs.wiktionary.org/w/index.php?title=Kategorie:Česká_substantiva&from="
WIKTIONARY_WORD_BASE_URL = "https://cs.wiktionary.org/wiki/"

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

def getWordInformation(word):
    fullUrl = WIKTIONARY_WORD_BASE_URL + word
    pageContent = getPage(fullUrl)
    tree = html.fromstring(pageContent)
    genderList = tree.xpath('//*[@id="mw-content-text"]/div/ul/li/i[starts-with(normalize-space(text()), "rod")]/text()')
    gender = None if len(genderList) == 0 else genderList[0]
    return gender
    # Gender
    # //*[@id="mw-content-text"]/div/ul/li/i[starts-with(normalize-space(text()), "rod")]/text()
    # Declensions:
    # //*[@id="mw-content-text"]/div/table[1]

def main():
    # print(getAllWords())
    print(getWordInformation("acidita"))

if __name__ == "__main__":
    main()
