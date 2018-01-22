
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
  completeVec <- complete.cases(data[, (desiredCols), with = FALSE])
  return(data[completeVec, ])
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
