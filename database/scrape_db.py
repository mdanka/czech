# -*- coding: utf-8 -*-

from lxml import html
import requests
import sys
import urllib3
import json

urllib3.disable_warnings()


WIKTIONARY_WORD_LIST_BASE_URL = u"https://cs.wiktionary.org/w/index.php?title=Kategorie:Česká_substantiva&from="
WIKTIONARY_WORD_BASE_URL = u"https://cs.wiktionary.org/wiki/"
WIKTIONARY_WORD_LIST_LETTERS = [u"A", u"B", u"C", u"Č", u"D", u"E", u"F", u"G", u"H", u"Ch", u"I", u"J", u"K", u"L", u"M", u"N", u"O", u"P", u"Q", u"R", u"Ř", u"S", u"Š", u"T", u"U", u"V", u"W", u"X", u"Y", u"Z", u"Ž"]
CASE_NAMES = [u"nominativ", u"genitiv", u"dativ", u"akuzativ", u"vokativ", u"lokál", u"instrumentál"]
ERROR_NO_GENDER = list()
ERROR_NO_7_CASES = list()

def getPage(fullUrl):
    try:
        r = requests.get(fullUrl, verify=False)
        return r.content
    except requests.exceptions.RequestException as e:
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
    wordsListList = list(map(getWordsForLetter, WIKTIONARY_WORD_LIST_LETTERS))
    wordsList = [item for sublist in wordsListList for item in sublist]
    uniqueWordsList = list(set(wordsList))
    uniqueWordsList.sort()
    return uniqueWordsList

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
    multipleValues = map(lambda value: value.strip(), strippedValue.split(u"/"))
    return multipleValues

def getCase(case):
    return {
        'singular': getCaseValue(case[0]) if len(case) >= 1 else None,
        'plural': getCaseValue(case[1]) if len(case) >= 2 else None
    }

def getCaseFromTree(tree, caseName):
    matches = tree.xpath('//*[@id="mw-content-text"]/div/table/tbody/tr[normalize-space(th/span/text()) = "' + caseName + '"]/td/descendant-or-self::*/text()')
    if len(matches) < 2:
        return None
    return matches

def getWordInformation(word):
    print("### Getting word: " + word)
    fullUrl = WIKTIONARY_WORD_BASE_URL + word
    pageContent = getPage(fullUrl)
    tree = html.fromstring(pageContent)
    genderList = tree.xpath('//*[@id="mw-content-text"]/div/ul/li/i[starts-with(normalize-space(text()), "rod")]/text()')
    genderString = None if len(genderList) == 0 else genderList[0]
    if genderString == None:
        print(u"!!! No GENDER information for: " + word)
        ERROR_NO_GENDER.append(word)
        return None
    cases = list(map(lambda caseName: getCaseFromTree(tree, caseName), CASE_NAMES))
    casesFiltered = list(filter(lambda x: x != None, cases))
    if len(casesFiltered) < 7:
        print(u"!!! No 7 CASES for: " + word)
        ERROR_NO_7_CASES.append(word)
        return None
    print("Done with word " + word)
    return {
        'gender': genderStringToGender(genderString),
        'isAnimated': genderStringToAnimated(genderString),
        'nominative': getCase(casesFiltered[0]),
        'genitive': getCase(casesFiltered[1]),
        'dative': getCase(casesFiltered[2]),
        'accusative': getCase(casesFiltered[3]),
        'vocative': getCase(casesFiltered[4]),
        'locative': getCase(casesFiltered[5]),
        'instrumental': getCase(casesFiltered[6]),
    }

def getAllWordInformation():
    allWords = getAllWords()
    wordMap = {word:getWordInformation(word) for word in allWords}
    return wordMap

def writeStringToFile(filename, string):
    myFile = open(filename, "w", encoding='utf-8')
    myFile.write(string)
    myFile.close()

def main():
    allWordInformation = getAllWordInformation()
    allWordInformationJson = json.dumps(allWordInformation)
    print("### Persisting to files...")
    # Persist words
    writeStringToFile(r"words.json", allWordInformationJson)
    # Persist issues
    writeStringToFile(r"errors_no_gender.txt", "\n".join(ERROR_NO_GENDER))
    writeStringToFile(r"errors_no_7_cases.txt", "\n".join(ERROR_NO_7_CASES))
    print("Done.")

if __name__ == "__main__":
    main()
