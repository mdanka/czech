# -*- coding: utf-8 -*-

from lxml import html
import requests
import sys
import urllib3

urllib3.disable_warnings()


WIKTIONARY_WORD_LIST_BASE_URL = u"https://cs.wiktionary.org/w/index.php?title=Kategorie:Česká_substantiva&from="
WIKTIONARY_WORD_BASE_URL = u"https://cs.wiktionary.org/wiki/"
WIKTIONARY_WORD_LIST_LETTERS = [u"A", u"B", u"C", u"Č", u"D", u"E", u"F", u"G", u"H", u"Ch", u"I", u"J", u"K", u"L", u"M", u"N", u"O", u"P", u"Q", u"R", u"Ř", u"S", u"Š", u"T", u"U", u"V", u"W", u"X", u"Y", u"Z", u"Ž"]
CASE_NAMES = [u"nominativ", u"genitiv", u"dativ", u"akuzativ", u"vokativ", u"lokál", u"instrumentál"]

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
    print("### Getting words for letter: " + letter)
    fullUrl = WIKTIONARY_WORD_LIST_BASE_URL + letter
    pageContent = getPage(fullUrl)
    tree = html.fromstring(pageContent)
    words = tree.xpath('//*[@id="mw-pages"]/div/div/div/ul/li/a/text()')
    print("### Done getting words for letter " + letter)
    return words

def getAllWords():
    wordsListList = map(getWordsForLetter, WIKTIONARY_WORD_LIST_LETTERS)
    wordsList = [item for sublist in wordsListList for item in sublist]
    return wordsList

def genderStringToGender(genderString):
    if genderString == None:
        return None
    if u"ženský" in genderString:
        return "f"
    if u"mužský" in genderString:
        return "m"
    return "n"

def genderStringToAnimated(genderString):
    if genderString == None:
        return None
    # Leading space to avoid matching "neživotný"
    if u" životný" in genderString:
        return True
    return False

def getCaseValue(value):
    if value == None:
        return None
    strippedValue = value.strip()
    if strippedValue == u"—" or strippedValue == u"":
        return None
    return strippedValue

def getCase(case):
    return {
        'singular': getCaseValue(case[0]) if len(case) >= 1 else None,
        'plural': getCaseValue(case[1]) if len(case) >= 2 else None
    }

def getWordInformation(word):
    print("### Getting word: " + word)
    fullUrl = WIKTIONARY_WORD_BASE_URL + word
    pageContent = getPage(fullUrl)
    tree = html.fromstring(pageContent)
    genderList = tree.xpath('//*[@id="mw-content-text"]/div/ul/li/i[starts-with(normalize-space(text()), "rod")]/text()')
    genderString = None if len(genderList) == 0 else genderList[0]
    if genderString == None:
        print(u"!!! No GENDER information for: " + word)
        return None
    cases = map(lambda caseName: tree.xpath('//*[@id="mw-content-text"]/div/table/tbody/tr[normalize-space(th/span/text()) = "' + caseName + '"]/td/descendant-or-self::*/text()'), CASE_NAMES)
    if len(cases) < 7:
        print(u"!!! No 7 CASES for: " + word)
        return None
    print("Done with word " + word)
    return {
        'gender': genderStringToGender(genderString),
        'isAnimated': genderStringToAnimated(genderString),
        'nominative': getCase(cases[0]),
        'genitive': getCase(cases[1]),
        'dative': getCase(cases[2]),
        'accusative': getCase(cases[3]),
        'vocative': getCase(cases[4]),
        'locative': getCase(cases[5]),
        'instrumental': getCase(cases[6]),
    }

def getAllWordInformation():
    allWords = getAllWords()
    wordMap = {word:getWordInformation(word) for word in (allWords[0:10])}
    return wordMap

def main():
    print(getAllWordInformation())
    # print(getWordInformation("abakus"))
    # print(getWordInformation("Aachen"))

if __name__ == "__main__":
    main()
