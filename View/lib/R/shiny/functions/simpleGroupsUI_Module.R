# shiny module to create the 5 ui necessary for making custom groups
# does not use shinyTree, while customGroups does
#also no prtcpnt vs obs view. this is basically the generic version

simpleGroupsUI <- function(id, colWidth = 6) {
  #need a namespace
  ns <- NS(id)
  
  #here use uiOutput and maybe also taglist.. not sure yet how to get it into a column
  tagList(
    column(colWidth, align = "left",
           fluidRow(
             uiOutput(ns("choose_group"))
           ),
           fluidRow(
             uiOutput(ns("choose_stp1"))
           ),
           fluidRow(
             uiOutput(ns("choose_stp2"))
           ),
           fluidRow(
             uiOutput(ns("choose_stp3"))
           ),
           fluidRow(
             uiOutput(ns("choose_stp4"))
           )
    )
  )
}

#make sure this returns inputs and range info 
simpleGroups <- function(input, output, session, groupLabel = "Name Me!!", metadata.file, include = c("all"), singleVarData, selected = reactive("custom"), groupsType = reactive("makeGroups"), groupsTypeID = NULL, moduleName, taxa = NULL) {
  ns <- session$ns

  #propUrl <<- getPropertiesUrl(session) 
  #properties <- try(fread(propUrl))

  #if (grepl("Error", properties)) {
    properties <- NULL
  #}   
 
  groupRange <- reactiveValues()  
  
  observeEvent(input$group,{
    if(is.null(input$group)) {
      return()
    }
    myGroup <- input$group
    nums <- getNums(metadata.file)
    dates <- getDates(metadata.file)
   
    if (myGroup %in% nums$source_id | myGroup %in% dates$source_id) {
      data <- singleVarData
      tempDF <- completeDT(data, myGroup)
      
      groupRange$myMin <- min(tempDF[[myGroup]])
      groupRange$myMax <- max(tempDF[[myGroup]])
      
      if (myGroup %in% nums$source_id) {
        groupRange$mean <- mean(tempDF[[myGroup]])
      } else {
        groupRange$startDate <- as.Date(quantile(as.POSIXct(tempDF[[myGroup]]), .25))
        groupRange$endDate <- as.Date(quantile(as.POSIXct(tempDF[[myGroup]]), .75))
        groupRange$myMin <- as.Date(groupRange$myMin)
        groupRange$myMax <- as.Date(groupRange$myMax)
        message(paste("start and end dates:", groupRange$startDate, groupRange$endDate))
      }
    } else if (grepl("RelativeAbundance_", myGroup)) {
      groupRange$myMin <- 0
      groupRange$myMax <- 1
      #TODO can actually calculate mean later if we want, right now setting these to .5 by default
      groupRange$mean <- 0.5
    }
    
  })
  
  output$choose_group <- renderUI({
    if (is.null(groupsType()) | is.null(metadata.file)) {
      return()
    }
    if (groupsType() != "makeGroups" & groupsType() != "direct") {
      return()
    }
 
    if (groupsType() == "makeGroups") {
      attrChoiceList <- getSimpleUIList(data = singleVarData, metadata.file = metadata.file, include = include, taxa = taxa)
    } else {
      attrChoiceList <- getSimpleUIList(data = singleVarData, metadata.file = metadata.file, include = include, maxLevels = 12, taxa = taxa)
    }
       
    dontUseProps <- FALSE
    if (is.null(properties)) {
      dontUseProps <- TRUE
    } else {
        if (!is.null(groupsTypeID)) {
          groupsTypeSelected <- properties$selected[properties$input == groupsTypeID]
        } else {
          groupsTypeSelected <- NULL
        }
        if (!is.null(groupsType()) & !is.null(groupsTypeSelected)) {
          if (groupsTypeSelected != groupsType()) {
            dontUseProps <- TRUE
          }
        } else {
          return
        }
    }
    
    if (dontUseProps) {
      mySelected = selected()
    } else {
      mySelected = properties$selected[properties$input == paste0(moduleName, "$group")]
    }
    
    #this should only happen if switching from 'none' to other for groupsType
    if (mySelected == "") {
      mySelected <- "custom"
    } 

    selectInput(inputId = ns("group"),
                label = groupLabel(),
                choices = attrChoiceList,
                selected = mySelected,
                width = '100%')
  })

  output$choose_stp1 <- renderUI({
    if (is.null(input$group)) {
      return()
    }
 
    if (groupsType() != "makeGroups") {
      return()
    }
    myGroup <- input$group
    nums <- getNums(metadata.file)
    if (!is.null(taxa)) {
      nums <- rbind(nums, data.table("source_id" = paste0("RelativeAbundance_", taxa()))) 
    }
    dates <- getDates(metadata.file)
    
    data <- singleVarData
    tempDF <- completeDT(data, myGroup)
    attrStp1List <- getUIStp1List(singleVarData, myGroup)
    
    myGroupSelected <- properties$selected[properties$input == paste0(moduleName, "$group")]
    mySelected <- properties$selected[properties$input == paste0(moduleName, "$group_stp1")]
    groupsTypeSelected <- properties$selected[properties$input == groupsTypeID]  

    dontUseProps <- FALSE
    if (is.null(properties)) {
      dontUseProps <- TRUE
    } else {
      if (myGroupSelected != myGroup) {
        dontUseProps <- TRUE
      }
      if (!is.null(groupsTypeID)) {
        if (!is.null(groupsTypeSelected)) {
          if (groupsType() != groupsTypeSelected & myGroup %in% dates$source_id) {
            dontUseProps <- TRUE
          }
        }
      }
    }

    if (dontUseProps) {
        if (myGroup %in% nums$source_id) {
          mySelected = "greaterThan"
        } else if (myGroup %in% dates$source_id) {
          mySelected1 = groupRange$startDate
          mySelected2 = groupRange$endDate
        } else {
          if (length(attrStp1List) == 2) {
            if (any(attrStp1List %in% "Yes")) {
              mySelected = "Yes"
            } else if (any(attrStp1List %in% "TRUE")) {
              mySelected = "TRUE"
            } else {
              mySelected = NULL
            }
          } else {
            mySelected = NULL
          }
      }
    } else {
      if (mySelected == 'all' | mySelected == 'any') {
        obs <- TRUE
      }
    }
  
      if (myGroup %in% nums$source_id) {
        selectInput(inputId = ns("group_stp1"),
                    label = "is",
                    choices = list('<' = 'lessThan', '>' = 'greaterThan', '=' = 'equals'),
                    selected = mySelected,
                    width = '100%')
      } else if (myGroup %in% dates$source_id) {
        mySelected1 <- properties$selected[properties$input == paste0(moduleName, "$group_stp1[1]")]
        mySelected2 <- properties$selected[properties$input == paste0(moduleName, "$group_stp1[2]")]
        dateRangeInput(inputId = ns("group_stp1"),
                       label = "is between",
                       start = mySelected1, end = mySelected2,
                       min = groupRange$myMin, max = groupRange$myMax,
                       separator = "and",
                       startview = "year")
      } else {
        #let select multiple
        maxInputs <- length(attrStp1List) -1
        if (maxInputs == 1) {
          selectInput(inputId = ns("group_stp1"),
                      label = "are / is",
                      choices = attrStp1List,
                      selected = mySelected,
                      width = '100%')
        } else {
          selectizeInput(inputId = ns("group_stp1"),
                    label = "are / is",
                    choices = attrStp1List,
                    selected = mySelected,
                    width = '100%',
                    multiple = TRUE,
                    options = list(maxItems = maxInputs,
                                   placeholder = '-Selected Items Will Appear Here-'))
        }
      }
  })
  
  output$choose_stp2 <- renderUI ({
    if (is.null(input$group_stp1)) {
       return()
    }
    if (input$group_stp1 == "") {
      return()
    }
    if (groupsType() != "makeGroups") {
      return()
    }
    
    myStp1Val <- input$group_stp1
    myStp1Selected <- properties$selected[properties$input == paste0(moduleName, "$group_stp1")]
    mySelected <- properties$selected[properties$input == paste0(moduleName, "$group_stp2")]    
    myGroup <- input$group 

    nums <- getNums(metadata.file)
    if (!is.null(taxa)) {
      nums <- rbind(nums, data.table("source_id" = paste0("RelativeAbundance_", taxa()))) 
    }
    dates <- getDates(metadata.file)
    attrStp1List <- getUIStp1List(singleVarData, myGroup)

    numeric <- c("lessThan", "greaterThan", "equals")
    obs <- c("all", "any")

    dontUseProps <- FALSE
    if (is.null(properties)) {
      dontUseProps <- TRUE
    } else {
      if (myStp1Selected != myStp1Val) {
        dontUseProps <- TRUE
      }
    }
    
    if (dontUseProps) {
      if (myStp1Val %in% obs) {
        if (myGroup %in% nums$source_id) {
          mySelected = "greaterThan"
        } else if (myGroup %in% dates$source_id) {
          mySelected1 = groupRange$startDate
          mySelected2 = groupRange$endDate
        } else {
          if (length(attrStp1List) == 2) {
            if (any(attrStp1List %in% "Yes")) {
              mySelected = "Yes"
            } else if (any(attrStp1List %in% "TRUE")) {
              mySelected = "TRUE"
            } else {
              mySelected = NULL
            }
          } else {
            mySelected = NULL
          }
        }
      } else {
        if (myStp1Val %in% numeric) {
          mySelected = groupRange$mean
        }
      }
    }

   if (myStp1Val %in% obs) {
      if (myGroup %in% nums$source_id) {
        selectInput(inputId = ns("group_stp2"),
                    label = NULL,
                    choices = list('<' = 'lessThan', '>' = 'greaterThan', '=' = 'equals'),
                    selected = mySelected,
                    width = '100%')
      } else if (myGroup %in% dates$source_id) {
        mySelected1 <- properties$selected[properties$input == paste0(moduleName, "$group_stp1[1]")]
        mySelected2 <- properties$selected[properties$input == paste0(moduleName, "$group_stp1[2]")]
        dateRangeInput(inputId = ns("group_stp2"),
                       label = "between",
                       start = mySelected1, end = mySelected2,
                       min = groupRange$myMin, max = groupRange$myMax,
                       separator = "and",
                       startview = "year")
      } else {
        #for obs vairs that are strings, want a multiplick that has a max of one less than the total choices
        maxInputs <- length(attrStp1List) -1
        selectizeInput(inputId = ns("group_stp2"),
                    label = NULL,
                    choices = attrStp1List,
                    selected = mySelected,
                    width = '100%',
                    multiple = TRUE,
                    options = list(maxItems = maxInputs,
                                   placeholder = '-Selected Items Will Appear Here-'))
      }
    } else {
      if (myStp1Val %in% numeric) {
        #just going to set default value to whatever the mean is
        sliderInput(ns("group_stp2"), NULL,
                  min = groupRange$myMin, max = groupRange$myMax, value = mySelected, step = .1, width = '100%')
      }
    }

  })
  
  output$choose_stp3 <- renderUI ({
    if (is.null(input$group_stp1)) {
      return()
    }
    if (is.null(input$group_stp2)) {
      return()
    }
    if (groupsType() != "makeGroups") {
      return()
    }
    myStp1Val <- input$group_stp1
    myStp1Selected <- properties$selected[properties$input == paste0(moduleName, "$group_stp1")]
    mySelected <- properties$selected[properties$input == paste0(moduleName, "$group_stp3")]
    myStp2Val <- input$group_stp2

    nums <- getNums(metadata.file)
    if (!is.null(taxa)) {
      nums <- rbind(nums, data.table("source_id" = paste0("RelativeAbundance_", taxa()))) 
    }
    dates <- getDates(metadata.file)

    numeric <- c("lessThan", "greaterThan", "equals")
    obs <- c("all", "any")

    dontUseProps <- FALSE
    if (is.null(properties)) {
      dontUseProps <- TRUE
    } else {
      if (myStp1Selected != myStp1Val) {
        dontUseProps <- TRUE
      }
    }

    if (dontUseProps) {
        if (myStp2Val %in% numeric) {
          mySelected = groupRange$mean
        }
    }
   
    if (myStp1Val %in% obs) {
      if (myStp2Val %in% numeric) {
        sliderInput(ns("group_stp3"), NULL,
                    min = groupRange$myMin, max = groupRange$myMax, value = mySelected, step = .1, width='100%')
      }
    }
 
  })
  
  return(input)
}
