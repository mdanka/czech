# -*- coding: utf-8 -*-

from lxml import html
import argparse
import requests
import sys
import urllib3
import json
import sys

urllib3.disable_warnings()


WIKTIONARY_WORD_LIST_BASE_URL = u"https://cs.wiktionary.org/w/index.php?title=Kategorie:Česká_substantiva&from="
WIKTIONARY_WORD_BASE_URL = u"https://cs.wiktionary.org/wiki/"
WIKTIONARY_WORD_LIST_LETTERS = [u"A", u"B", u"C", u"Č", u"D", u"E", u"F", u"G", u"H", u"Ch", u"I", u"J", u"K", u"L", u"M", u"N", u"O", u"P", u"Q", u"R", u"Ř", u"S", u"Š", u"T", u"U", u"V", u"W", u"X", u"Y", u"Z", u"Ž"]
CASE_NAMES = [u"nominativ", u"genitiv", u"dativ", u"akuzativ", u"vokativ", u"lokál", u"instrumentál"]
ERROR_NO_GENDER = list()
ERROR_NO_7_CASES = list()
ERROR_MULTIPLE_TABLES = list()
DATA_FILE_NAME = r"words.json"

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
    # Remove words which start with "Uživatel"
    wordsListFiltered = list(filter(lambda word: not u"Uživatel:" in word, wordsList))
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
        return []
    strippedValue = value.strip()
    if strippedValue == u"—" or strippedValue == u"":
        return []
    multipleValues = list(map(lambda value: value.strip(), strippedValue.split(u"/")))
    return multipleValues

def getCase(case):
    return {
        'singular': getCaseValue(case[0]) if len(case) >= 1 else [],
        'plural': getCaseValue(case[1]) if len(case) >= 2 else []
    }

def getTablesXPath():
    return '//*[@id="mw-content-text"]/div/table'

def getCaseXPath(caseName, indexString):
    return '//*[@id="mw-content-text"]/div/table[1]/tbody/tr[normalize-space(th/span/text()) = "' + caseName + '"]/td[' + indexString + ']/descendant-or-self::*/text()'

def getCaseFromTree(tree, caseName):
    singularMatches = tree.xpath(getCaseXPath(caseName, "1"))
    pluralMatches = tree.xpath(getCaseXPath(caseName, "2"))
    singularText = "".join(singularMatches)
    pluralText = "".join(pluralMatches)
    matches = [singularText, pluralText]
    # Only singular or plural column
    # TODO(mdanka): log error
    if len(matches) < 2:
        return None
    return matches

def getWordInformation(word):
    print("### Getting word: " + word)
    fullUrl = WIKTIONARY_WORD_BASE_URL + word
    pageContent = getPage(fullUrl)
    tree = html.fromstring(pageContent)
    genderList = tree.xpath('//*[@id="mw-content-text"]/div/ul/li/i[starts-with(normalize-space(text()), "rod")][1]/text()')
    genderString = None if len(genderList) == 0 else genderList[0]
    if genderString == None:
        print(u"!!! No GENDER information for: " + word)
        ERROR_NO_GENDER.append(word)
        return None
    tables = tree.xpath(getTablesXPath())
    if len(tables) > 1:
        print(u"!!! More than 1 TABLES for: " + word)
        ERROR_MULTIPLE_TABLES.append(word)
        # We don't return here, we will just pick the first table
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

def getAllWordInformation(isTestMode, wordsToUpdate):
    if isTestMode:
        allWords = ["absolvent"]
    elif wordsToUpdate != None:
        allWords = wordsToUpdate
    else:
        allWords = getAllWords()
    wordMap = {word:getWordInformation(word) for word in allWords}
    return wordMap

def mergeDatabases(existingWordInformation, newWordInforation):
    for key, value in newWordInforation.items():
        existingWordInformation[key] = value
    return existingWordInformation

def removeWordsFromDatabase(updatedWordInformation, wordsToDelete):
    for word in wordsToDelete:
        updatedWordInformation.pop(word, None)
    return updatedWordInformation

def readStringFromFile(filename):
    myFile = open(filename, "r", encoding='utf-8')
    string = myFile.read()
    myFile.close()
    return string

def writeStringToFile(filename, string):
    myFile = open(filename, "w", encoding='utf-8')
    myFile.write(string)
    myFile.close()

def getWiktionaryUrlForWord(word):
    return u"https://cs.wiktionary.org/wiki/{word}".format(word = word)

def getErrorLineForWord(word):
    url = getWiktionaryUrlForWord(word)
    return u"* [{word}]({url})\n".format(word = word, url = url)

def getErrorString(title, errorList):
    errorLines = "".join(list(map(getErrorLineForWord, errorList)))
    return u"# {title}:\n\n{errorLines}\n\n".format(title = title, errorLines = errorLines)

def writeErrorsToFile():
    errorStrings = [getErrorString("No gender available", ERROR_NO_GENDER), getErrorString("No 7 cases found", ERROR_NO_7_CASES), getErrorString("Multiple tables on the page", ERROR_MULTIPLE_TABLES)]
    errorText = "".join(errorStrings)
    writeStringToFile(r"errors.md", errorText)

###########
# TESTING #
###########

TEST_CASES = {
    # Multiple solutions
    "absolvent": u'{"gender": "m", "isAnimated": true, "nominative": {"singular": ["absolvent"], "plural": ["absolventi"]}, "genitive": {"singular": ["absolventa"], "plural": ["absolvent\u016f"]}, "dative": {"singular": ["absolventu", "absolventovi"], "plural": ["absolvent\u016fm"]}, "accusative": {"singular": ["absolventa"], "plural": ["absolventy"]}, "vocative": {"singular": ["absolvente"], "plural": ["absolventi"]}, "locative": {"singular": ["absolventu", "absolventovi"], "plural": ["absolventech"]}, "instrumental": {"singular": ["absolventem"], "plural": ["absolventy"]}}',
    "kandelábr": u'{"gender": "m", "isAnimated": false, "nominative": {"singular": ["kandel\u00e1br"], "plural": ["kandel\u00e1bry"]}, "genitive": {"singular": ["kandel\u00e1bru"], "plural": ["kandel\u00e1br\u016f"]}, "dative": {"singular": ["kandel\u00e1bru"], "plural": ["kandel\u00e1br\u016fm"]}, "accusative": {"singular": ["kandel\u00e1br"], "plural": ["kandel\u00e1bry"]}, "vocative": {"singular": ["kandel\u00e1bre", "kandel\u00e1b\u0159e"], "plural": ["kandel\u00e1bry"]}, "locative": {"singular": ["kandel\u00e1bru"], "plural": ["kandel\u00e1brech"]}, "instrumental": {"singular": ["kandel\u00e1brem"], "plural": ["kandel\u00e1bry"]}}',
    "chlápek": u'{"gender": "m", "isAnimated": true, "nominative": {"singular": ["chl\u00e1pek"], "plural": ["chl\u00e1pci", "chl\u00e1pkov\u00e9"]}, "genitive": {"singular": ["chl\u00e1pka"], "plural": ["chl\u00e1pk\u016f"]}, "dative": {"singular": ["chl\u00e1pkovi", "chl\u00e1pku"], "plural": ["chl\u00e1pk\u016fm"]}, "accusative": {"singular": ["chl\u00e1pka"], "plural": ["chl\u00e1pky"]}, "vocative": {"singular": ["chl\u00e1pku"], "plural": ["chl\u00e1pkov\u00e9", "chl\u00e1pci"]}, "locative": {"singular": ["chl\u00e1pkovi", "chl\u00e1pku"], "plural": ["chl\u00e1pc\u00edch[1]"]}, "instrumental": {"singular": ["chl\u00e1pkem"], "plural": ["chl\u00e1pky"]}}',
    "jedenáctiúhelník": u'{"gender": "m", "isAnimated": false, "nominative": {"singular": ["jeden\u00e1cti\u00faheln\u00edk"], "plural": ["jeden\u00e1cti\u00faheln\u00edky"]}, "genitive": {"singular": ["jeden\u00e1cti\u00faheln\u00edka", "jeden\u00e1cti\u00faheln\u00edku"], "plural": ["jeden\u00e1cti\u00faheln\u00edk\u016f"]}, "dative": {"singular": ["jeden\u00e1cti\u00faheln\u00edku"], "plural": ["jeden\u00e1cti\u00faheln\u00edk\u016fm"]}, "accusative": {"singular": ["jeden\u00e1cti\u00faheln\u00edk"], "plural": ["jeden\u00e1cti\u00faheln\u00edky"]}, "vocative": {"singular": ["jeden\u00e1cti\u00faheln\u00edku"], "plural": ["jeden\u00e1cti\u00faheln\u00edky"]}, "locative": {"singular": ["jeden\u00e1cti\u00faheln\u00edku"], "plural": ["jeden\u00e1cti\u00faheln\u00edc\u00edch"]}, "instrumental": {"singular": ["jeden\u00e1cti\u00faheln\u00edkem"], "plural": ["jeden\u00e1cti\u00faheln\u00edky"]}}',
    # No plural
    "Ahaggar": u'{"gender": "m", "isAnimated": false, "nominative": {"singular": ["Ahaggar"], "plural": []}, "genitive": {"singular": ["Ahaggaru"], "plural": []}, "dative": {"singular": ["Ahaggaru"], "plural": []}, "accusative": {"singular": ["Ahaggar"], "plural": []}, "vocative": {"singular": ["Ahaggare"], "plural": []}, "locative": {"singular": ["Ahaggaru"], "plural": []}, "instrumental": {"singular": ["Ahaggarem"], "plural": []}}',
    # No declensions
    "aha": u'{"gender": "n", "isAnimated": false, "nominative": {"singular": ["aha"], "plural": []}, "genitive": {"singular": [], "plural": []}, "dative": {"singular": [], "plural": []}, "accusative": {"singular": [], "plural": []}, "vocative": {"singular": [], "plural": []}, "locative": {"singular": [], "plural": []}, "instrumental": {"singular": [], "plural": []}}',
    # Normal
    "jalovice": u'{"gender": "f", "isAnimated": false, "nominative": {"singular": ["jalovice"], "plural": ["jalovice"]}, "genitive": {"singular": ["jalovice"], "plural": ["jalovic"]}, "dative": {"singular": ["jalovici"], "plural": ["jalovic\u00edm"]}, "accusative": {"singular": ["jalovici"], "plural": ["jalovice"]}, "vocative": {"singular": ["jalovice"], "plural": ["jalovice"]}, "locative": {"singular": ["jalovici"], "plural": ["jalovic\u00edch"]}, "instrumental": {"singular": ["jalovic\u00ed"], "plural": ["jalovicemi"]}}',
    # No gender
    "naplat": u'null',
    # Multiple declension tables (we pick the first one)
    "haken": u'{"gender": "m", "isAnimated": true, "nominative": {"singular": ["haken"], "plural": ["hakeni", "hakenov\u00e9"]}, "genitive": {"singular": ["hakena"], "plural": ["haken\u016f"]}, "dative": {"singular": ["hakenu", "hakenovi"], "plural": ["haken\u016fm"]}, "accusative": {"singular": ["hakena"], "plural": ["hakeny"]}, "vocative": {"singular": ["hakene"], "plural": ["hakeni", "hakenov\u00e9"]}, "locative": {"singular": ["hakenovi", "hakenu"], "plural": ["hakenech"]}, "instrumental": {"singular": ["hakenem"], "plural": ["hakeny"]}}',
    # Multiple nouns tables (for now, we just take the first one)
    "pahejl": u'{"gender": "m", "isAnimated": false, "nominative": {"singular": ["pahejl"], "plural": ["pahejly"]}, "genitive": {"singular": ["pahejlu"], "plural": ["pahejl\u016f"]}, "dative": {"singular": ["pahejlu"], "plural": ["pahejl\u016fm"]}, "accusative": {"singular": ["pahejl"], "plural": ["pahejly"]}, "vocative": {"singular": ["pahejle"], "plural": ["pahejly"]}, "locative": {"singular": ["pahejlu"], "plural": ["pahejlech"]}, "instrumental": {"singular": ["pahejlem"], "plural": ["pahejly", "pahejlama"]}}'
}

def checkEqual(expected, actual, word):
    if (expected == actual):
        print("[Test passed]")
        return True
    print(u"[TEST ERROR] For word '{word}': expected\n{expected}\nbut received\n{actual}\n".format(expected = json.dumps(expected), actual = json.dumps(actual), word = word))
    return False

def test():
    results = []
    for word, expectedJsonString in TEST_CASES.items():
        expectedDictionary = json.loads(expectedJsonString)
        actualDictionary = getWordInformation(word)
        result = checkEqual(expectedDictionary, actualDictionary, word)
        results.append(result)
    return all(results)

def main():
    parser = argparse.ArgumentParser(description='Create a word database by scraping Wiktionary.')
    parser.add_argument("--updateWords", metavar="<word>", nargs="+",
                    help="instead of the default full list generation just updates the provided list of words")
    parser.add_argument("--deleteWords", metavar="<word>", nargs="+",
                    help="instead of the default full list generation just deleted the provided list of words")
    parser.add_argument("--test", action="store_true", help="run in test mode (outputting just a single word)")
    args = parser.parse_args()
    isTestMode = args.test
    wordsToUpdate = args.updateWords
    isUpdate = wordsToUpdate != None
    wordsToDelete = args.deleteWords
    isDelete = wordsToDelete != None
    isFullFetch = not isUpdate and not isDelete

    if isTestMode:
        print("~~~~~~~~~~~~~~~~~")
        print("~~~ TEST MODE ~~~")
        print("~~~~~~~~~~~~~~~~~")
    # Unit tests (always run them)
    testResult = test()
    if not testResult:
        print("TESTS FAILED. Quitting...")
        sys.exit()
    if isFullFetch:
        newWordInformation = getAllWordInformation(isTestMode, wordsToUpdate)
        outputJson = json.dumps(newWordInformation)
    else:
        inputJson = readStringFromFile(DATA_FILE_NAME)
        updatedWordInformation = json.loads(inputJson)
        if isUpdate:
            newWordInformation = getAllWordInformation(isTestMode, wordsToUpdate)
            updatedWordInformation = mergeDatabases(updatedWordInformation, newWordInformation)
        if isDelete:
            updatedWordInformation = removeWordsFromDatabase(updatedWordInformation, wordsToDelete)
        outputJson = json.dumps(updatedWordInformation)
        
    print("### Persisting to files...")
    # Persist words
    writeStringToFile(DATA_FILE_NAME, outputJson)
    # Persist errors
    if isFullFetch:
        writeErrorsToFile()
    print("Done.")

if __name__ == "__main__":
    main()
