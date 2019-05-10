require(shiny)

# A function that fetches the passed contextHash or ID of a
# WDK step analysis, loads the data file output into a dataset,
# and returns it.  If fetchStyle is "disk", file is read
# directly from the step analysis storage dir (passed in). If
# fetchStyle is "url", data is read from URL.

getWdkDataset <- function(session, fetchStyle, filename, expectHeader, dataStorageDir="") {

  query = parseQueryString(session$clientData$url_search)

  if (fetchStyle == "disk") {
    contextHash = get("contextHash", query)
    projectFolder <- get("projectFolder", query)
    shiny:::validate(
      need(contextHash != "", "Must pass a contextHash query parameter"),
      need(projectFolder != "", "Must pass the data storage directory as a query parameter"),
      need(grepl("..",contextHash), "Hash must be sent alone")
    )
    dataFile <- paste0(dataStorageDir, "/", projectFolder, "/", contextHash, "/", filename)
    print(paste0("Will read from: ", dataFile), stderr())
    #read.table(dataFile, sep="\t", header=expectHeader)
    read.csv(dataFile, sep = "\t", as.is=TRUE, na.strings=(list("null")))
  }
  else {
    # this style currently allows only one data file in the 'dataUrl' query param
    fetchUrl = get("dataUrl", query)
    shiny:::validate(
        need(fetchUrl != "", "Must pass a dataUrl query paramenter")
    )
    print(paste0("Will read from: ", fetchUrl), stderr())
    read.table(fetchUrl, sep="\t", header=expectHeader)
  }
}

## following funciton returns the full path to the filename passed in as first argument

getWdkDatasetFile <- function(filename, session, expectHeader, dataStorageDir="") {

  query = parseQueryString(session$clientData$url_search)

  contextHash = get("contextHash", query)
  projectFolder <- get("projectFolder", query)
  shiny:::validate(
    need(contextHash != "", "Must pass a contextHash query parameter"),
    need(projectFolder != "", "Must pass the data storage directory as a query parameter"),
    need(grepl("..",contextHash), "Hash must be sent alone")
  )
  dataFile <- paste0(dataStorageDir, "/", projectFolder, "/", contextHash, "/", filename)
  print(paste0("Will read from: ", dataFile), stderr())
  dataFile
}

#this to get propertiesURL from query param

getPropertiesUrl <- function(session) {

  query = parseQueryString(session$clientData$url_search)

  fetchUrl = get("propertiesUrl", query)
  
  fetchUrl
}
