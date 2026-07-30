<head>
  <title><?=$_SERVER['HTTP_HOST']?>/dashboard</title>
  <meta http-equiv="content-type" content="text/html; charset=iso-8859-1"/>

  <link rel="stylesheet" type="text/css" href="css/ui-lightness/jquery-ui-1.8.21.custom.css"/>
  <link rel="stylesheet" type="text/css" href="css/main.css"/>
  <!-- use local JS files. Do not make client fetch from  Google because site might be hosted on a virtual machine with no internet acdess -->
  <script type='text/javascript' src='js/jquery.min.js'></script>
  <script type='text/javascript' src='js/jquery-ui.min.js'></script>

  <!--
    overlib configuration.  This has to come *before* overlib.js: the library
    declares each option as `if (typeof ol_x=='undefined') var ol_x=...`, so
    setting them first is how you override a default, and setting them after
    with `const` is a redeclaration of an existing global var -- a SyntaxError
    that throws out this whole block.

    ABOVE / BELOW are overlib's own positional constants, but this copy of
    overlib.js reads them without ever defining them (its constants section is
    missing them), so top-level `var o3_vpos=BELOW` throws and the library stops
    loading.  Defining them here fixes that; only their distinctness matters,
    since overlib merely compares against them.
  -->
  <script type="text/javascript">
    var ABOVE = 1;
    var BELOW = 2;

    var ol_textcolor = "#003366";
    var ol_fgcolor = "#ffffff";
    var ol_bgcolor = "#003366";
    var ol_textsize = "11px";
    var ol_cellpad = "5";
    var ol_height = -1;
    var ol_vpos = ABOVE;
  </script>

  <script type='text/javascript' src='js/overlib.js'></script>
  <script type='text/javascript' src='js/main.js'></script>
  <script type='text/javascript' src='js/tableSort.js'></script>
</head>

