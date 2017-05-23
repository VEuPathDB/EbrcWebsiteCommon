#!/usr/bin/env Rscript

library(shiny)

# get app dir name and port from args
args <- commandArgs(trailingOnly=TRUE)
appName <- args[1]
port <- args[2]
if (is.na(appName) || is.na(port)) {
  print("USAGE: startup.R <app_dir> <port>")
  q()
}

# run the app
print(paste0("Starting ", appName, " on port ", port))
runApp(paste0("apps/",appName), strtoi(port), host="0.0.0.0")
