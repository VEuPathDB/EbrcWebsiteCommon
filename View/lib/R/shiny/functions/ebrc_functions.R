#assumes shiny only needs a single connection to a single appDB
manageOracleConnection <- function(drv, con, model.prop) {

  if (is.null(drv)) { 
    stop("Cannot create Oracle DB Connection. No driver provided. (Try making one with `dbDriver('Oracle')`") 
  }

  if (is.null(con)) {
    if (is.null(model.prop)) {
      stop("Cannot create Oracle DB Connection. No 'model.prop' file provided.")
    } else {
      warning("Specified DB connection is NULL. Will attempt to create another..")
      con <- createOracleConnection(drv, model.prop)
    }
  } else {
    conList <- dbListConnections(drv)
    if (length(conList) > 1) {
      stop("Too many oracle connections associated with driver. Please ensure only one connection to one appDB per driver.")
    } else if (length(conList) == 0) {
      warning("Specified DB connection does not exist. Will attempt to create another..")
      con <- createOracleConnection(drv, model.prop)
    } else {
      testQuery <- "select * from apidbtuning.datasetpresenter"
      testResult <- try(dbGetQuery(con, testQuery))
      if (grepl("Error", testResult[1])) {
        warning("Test query with provided DB connection has failed. Will try again with a new connection..")
        dbDisconnect(con)
        con <- createOracleConnection(drv, model.prop)
        testResult <- try(dbGetQuery(con, testQuery))
        if (grepl("Error", testResult[1])) {
          stop("Test query still failing.. Oracle DB connection could not be established.")
        }
      }
    }
  }

  con
}

createOracleConnection <- function(drv, model.prop) {
  gusHome <- model.prop$V2[model.prop$V1 == "gusHome"]
  project_id <- model.prop$V2[model.prop$V1 == "PROJECT_ID"]
  modelConfig <- paste0(gusHome, "/config/", project_id, "/model-config.xml")
  appDbInfo <- appDbFromConfigXml(modelConfig)
  con <- dbConnect(drv, appDbInfo$login, appDbInfo$password, unlist(strsplit(appDbInfo$connectionUrl, '@', fixed = TRUE))[2])

  con
}

appDbFromConfigXml <- function(file) {
  xml <- xmlParse(file)
  xmlList <- xmlToList(xml)
  appDb <- as.list(xmlList$appDb)
  appDb
}

#override ggplot cut_number function recursively decrease num bins until it works.
rcut_number <- function(data = c(), n = 4){
  hold <- try(ggplot2::cut_number(data, n), silent = TRUE)
  if (!grepl("Error", hold[1])){
    returnData <- hold
  } else {
    returnData <- rcut_number(data, n = n-1)
  }
  
  returnData
}

rcut <- function(data = c(), n=12) {
  hold <- try(cut(data,n), silent = TRUE)
  if (!grepl("Error", hold[1])) {
    returnData <- hold
  } else {
    returnData <- rcut(data, n = n-1)
  }

  returnData
}

isDate <- function(mydate, date.format = "%Y-%m-%d") {
  # Check if field is a date using as.Date that looks for unambiguous dates
  #   Assumes date format so NA returned not Character error. 
  #   Why? with no date format, R tries two defaults then gives error. 
  #   BUT With a dateformat R returns NA
  # Args
  #   Suspected date and optional date format string
  # Returns
  #   TRUE if thinbks it is a date
  tryCatch(!is.na(as.Date(mydate, date.format)),  
           error = function(err) {FALSE})  
}

setroworder <- function(x, neworder) {
    .Call(data.table:::Creorder, x, as.integer(neworder), PACKAGE = "data.table")
    invisible(x)
}

#this encloses another ui widget inside a dropdown
dropdownButton <- function(label = "", status = c("default", "primary", "success", "info", "warning", "danger"), ..., width = NULL) {
  
  status <- match.arg(status)
  # dropdown button content
  html_ul <- list(
    class = "dropdown-menu",
    style = if (!is.null(width)) 
      paste0("width: ", validateCssUnit(width), ";"),
    lapply(X = list(...), FUN = tags$li, style = "margin-left: 10px; margin-right: 10px;")
  )
  # dropdown button appearence
  html_button <- list(
    class = paste0("btn btn-", status," dropdown-toggle"),
    type = "button", 
    `data-toggle` = "dropdown"
  )
  html_button <- c(html_button, list(label))
  html_button <- c(html_button, list(tags$span(class = "caret")))
  # final result
  tags$div(
    class = "dropdown",
    do.call(tags$button, html_button),
    do.call(tags$ul, html_ul),
    tags$script(
      "$('.dropdown-menu').click(function(e) {
      e.stopPropagation();
});"
      )
  )
}

#returns dataframe (data) where all rows in desiredCols have values
completeDF <- function(data, desiredCols) {
  completeVec <- complete.cases(data[, desiredCols])
  return(data[completeVec, ])
}

completeDT <- function(data, desiredCols) {
  #completeVec <- complete.cases(data[, (desiredCols), with = FALSE])
  #return(data[completeVec, ])
  na.omit(data, cols = all.vars(desiredCols))
  return(data)
}

#converts NA to 0 by reference for a data TABLE
naToZero = function(DT, col = NULL) {
  if (is.null(col)) {
    for (j in seq_len(ncol(DT)))
      set(DT,which(is.na(DT[[j]])),j,0)
  } else {
    set(DT, which(is.na(DT[[col]])), col, 0)
  }
}

naToUnknown = function(DT, col = NULL) {
  if (is.null(col)) {
    for (j in seq_len(ncol(DT)))
      set(DT,which(is.na(DT[[j]])),j,"Unknown")
  } else {
    set(DT, which(is.na(DT[[col]])), col, "Unknown")
  }
}

naToNotSelected = function(DT, col = NULL) {
  if (is.null(col)) {
    for (j in seq_len(ncol(DT)))
      set(DT,which(is.na(DT[[j]])),j,"Not Selected")
  } else {
    set(DT, which(is.na(DT[[col]])), col, "Not Selected")
  }
}
