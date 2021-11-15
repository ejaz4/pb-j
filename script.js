/*
  Jumblejot 0.2.1
  Made with ♥ by Speedblocks.
  Released under Sargent Coding.
*/

/*
	NOTES:
	------
	JEE in 1.1 instead of 1.0?
*/

window.onload = () => {
    setup();
  }
  
  const espanol = {
    "Select something...": "Seleccionar algo...",
    "New": "Nuevo",
    "Rename": "Renombrar",
    "Export": "Descargar",
    "Delete": "Eliminar",
    "Settings": "Configuración"
  }
  
  // Set up some important variables
  var currentFile;
  var hist = {};
  var fileData;
  
  // Loading the app!
  const setup = async () => {
    byId("nav").click();
    let response;
    console.log("Loading settings and preferences...");
    response = await initSettings();
    console.log("Loading file data and creating file buttons...");
    response = await setup.files();
    response = await updateCustomTheme();
    console.log("Giving code preview proper permissions...");
    response = await setup.previewPerms();
    console.log("Setting up storage meters...");
    response = await updateStorageBar("local", checkSpace());
    console.log("Done!");
    loading.classList.add("doneLoading");
    setTimeout(() => {
      loading.remove()
    }, 500);
  }
  
  // Set up byId shortener
  const byId = (element) => {
    return document.getElementById(element);
  }
  
  // UI Control
  const loading = document.getElementById("loading");
  const workspace = document.getElementById("workspace");
  const textarea = document.getElementById("textarea");
  const sidebar = document.getElementById("sidebar");
  const preview = document.getElementById("preview");
  const files = document.getElementById("files");
  const storage = document.getElementById("storage");
  const finder = document.getElementById("finder");
  
  // Set up tempates
  const templates = {};
  templates.file = (name) => {
    let ext = name.substring(name.lastIndexOf(".") + 1, name.length);
    if (name.lastIndexOf(".") == -1) {
      ext = undefined;
    }
    let extNames = {
      undefined: "Extensionless File",
      jee: "Jumblejot Eazy Editor™",
      jumble: "☼ Jumblejot Configuration File",
      txt: "Plain Text",
      html: "Hypertext Markup Language",
      htm: "Hypertext Markup Language",
      css: "Cascading Style Sheets",
      js: "Javascript",
      json: "Javascript Object Notation",
      svg: "Scalable Vector Graphics",
      png: "Portable Network Graphics",
      jpg: "Joint Photographic Experts Group (3 letters)",
      jpeg: "Joint Photographic Experts Group",
      tif: "Tagged Image File Format (3 letters)",
      tiff: "Tagged Image File Format",
      bmp: "Bitmap",
      ico: "Icon",
      webp: "WebP"
    }
    let type;
    type = extNames[ext];
    if (extNames[ext] != undefined) {
      if (ext == "jee") {
        return `<button id="FILE:${name}" onclick="selectFile('${name}')">${name.slice(0, name.lastIndexOf('.'))}<br/><small>${type}</small></button>`;
      } else {
        return `<button id="FILE:${name}" onclick="selectFile('${name}')">${name}<br/><small>${type}</small></button>`;
      }
    } else {
      return `<button id="FILE:${name}" onclick="selectFile('${name}')">${name}</button>`;
    }
  }
  templates.finderFile = (name) => {
    return `<li onclick='selectFile("${name}");finder.close()' tabindex='0'>${name}</li>`
  }
  
  // Set up file data and create file buttons
  setup.files = async () => {
    if (localStorage.getItem("fileData") != null) {
      fileData = JSON.parse(localStorage.getItem("fileData"));
      let i = 0;
      for (let [key, value] of Object.entries(fileData)) {
        fileData[key] = value;
        createFileButton(key);
        if (i == 0) {
          if (localStorage.getItem("currentFile") == "null" || localStorage.getItem("currentFile") == "undefined") {
            selectFile(key);
          } else {
            currentFile = localStorage.getItem("currentFile");
            selectFile(currentFile);
          }
        }
        i++;
      }
    } else {
      fileData = "{}";
      fileData = JSON.parse(fileData);
      workspace.setPage("newFile");
    }
    updateStorageBar("local", checkSpace());
  }
  
  // Set up preview iframe permissions
  setup.previewPerms = () => {
    preview.perms = ["downloads", "forms", "modals", "pointer-lock", "popups", "presentation", "scripts", "top-navigation", "clipboard-read", "clipboard-write"]
    for (let i in preview.perms) {
      preview.sandbox.add("allow-" + preview.perms[i]);
    }
  }
  
  // Set page in the workspace
  workspace.setPage = (page) => {
    if (page != "textarea") {
      try {
        byId("FILE:" + currentFile).classList.remove("selected");
      } catch (err) {}
      selectFile();
    }
    for (let i = 0; i < workspace.children.length; i++) {
      if (page != workspace.children[i].id) {
        workspace.children[i].style.display = "none";
      } else {
        workspace.children[i].style.display = null;
      }
    }
  }
  
  // Creation of file buttons
  const createFileButton = async (name) => {
    byId("files").innerHTML += templates.file(name);
    byId("files").append(byId("FILE:" + name));
  }
  
  // Changing the files button text
  const changeFileButtonText = () => {
    if (currentFile != undefined) {
      byId("fileName").innerHTML = currentFile;
    } else {
      byId("fileName").innerHTML = `<span class="placeholder">Select something</span>`
    }
  }
  
  // Current file and file selection
  const selectFile = (file, start, end) => {
    try {
      byId("FILE:" + currentFile).classList.remove("selected");
    } catch (err) {
      console.log(`There wasn't a file selected before the selection of ${file}, more info:\n${err}`);
    }
    currentFile = file;
    changeFileButtonText();
    localStorage.setItem("currentFile", currentFile);
    try {
        byId("FILE:" + file).classList.add("selected");
        byId("files").prepend(byId("FILE:" + file));
      let order = {};
          order[file] = null;
          fileData = Object.assign(order, fileData);
          localStorage.setItem("fileData", JSON.stringify(fileData));
    } catch (err) {
      console.log("User selected a non-file, more info:\n" + err);
    }
    workspace.setPage("textarea");
    textarea.value = fileData[file];
    updatePreview();
    flyUp(textarea);
    textarea.focus();
    if (start != undefined) {
      let full = fileData[file];
      textarea.value = full.substring(0, end);
      textarea.scrollTop = textarea.scrollHeight;
      textarea.value = full;
      textarea.setSelectionRange(start, end);
    } else {
      textarea.scrollTop = 0;
    }
  }
  
  // Toggle files
  var filesShown = true;
  byId("currentFile").onclick = () => {
    filesShown = !filesShown;
    byId("main").style.transform = filesShown ? null : `translateX(-${sidebar.getBoundingClientRect().width}px)`;
    workspace.style.width = filesShown ? null : `100vw`;
    byId("main").style.marginRight = filesShown ? null : `-${sidebar.getBoundingClientRect().width}px`
  }
  
  const switchTheme = (option) => {
    theme = option;
    document.body.className = "";
    switch (option) {
      case "light":
        break;
      case "dark":
        document.body.classList.add("DARK");
        break;
      case "custom":
        document.body.classList.add("CUSTOM");
        break;
      case "url":
        document.body.classList.add("URL");
        break;
      default:
        switchTheme("light");
        break;
    }
    localStorage.setItem("theme", theme);
    if (fileData != undefined) {
      updateCustomTheme();
    }
  }
  
  // Themes in settings
  byId("theme-light").onchange = () => {
    switchTheme("light");
  }
  
  byId("theme-dark").onchange = () => {
    switchTheme("dark");
  }
  
  byId("theme-custom").onchange = () => {
    switchTheme("custom");
  }
  
  byId("theme-url").onchange = () => {
    switchTheme("url");
  }
  
  /* Updating the theme */
  const updateCustomTheme = () => {
    try {
      let customTheme = JSON.parse(fileData["theme.jumble"]);
      let cssNameExceptions = {
        "colours.background.main": "colours-background",
        "radii.main": "radii"
      }
      let getObjects = (obj, origin) => {
        for (let [key, value] of Object.entries(obj)) {
          let path = (origin != undefined) ? `${origin}.${key}` : key;
          if (value && typeof value == "object" && !Array.isArray(value)) {
            getObjects(value, path)
          } else {
            if (Array.isArray(value)) {
              obj[key] = value.join(", ");
            }
            if (cssNameExceptions.hasOwnProperty(path)) {
              document.querySelector(".CUSTOM").style.setProperty("--" + cssNameExceptions[path], obj[key])
            } else {
              document.querySelector(".CUSTOM").style.setProperty("--" + path.replace(/\./g, "-"), obj[key])
            }
          }
        }
      }
      if (theme == "custom") {
        getObjects(customTheme);
      } else {
        try {
          document.body.removeAttribute("style");
        } catch (err) {}
      }
    } catch (err) {
      if (fileData["theme.jumble"] != undefined) {
          alert(`There's an issue with your custom theme...\n` + err);
      }
    }
  }
  
  // Default Settings
  var allocatedHistory = 25;
  var tabSize = 2;
  
  // Init settings and preferences
  const initSettings = async () => {
    console.log("[SETTINGS] Loading theme...")
    var theme = switchTheme(localStorage.getItem("theme"));
    allocatedHistory = 25;
    tabSize = 2;
  }
  
  // When textarea is edited
  textarea.oninput = (event, noHist) => {
    fileData[currentFile] = textarea.value;
    localStorage.setItem("fileData", JSON.stringify(fileData));
    if (!noHist) {
      updateHistory(currentFile);
    }
    updateStorageBar("local", checkSpace());
    updatePreview();
  }
  
  // Remake undo and redo
  const updateHistory = (file) => {
    if (hist[file] == undefined) {
      hist[file] = {};
      hist[file].data = [];
      hist[file].index = 0;
    }
    hist[file].data.push(fileData[file]);
    if (hist[file].data.length > allocatedHistory) {
      hist[file].data.shift();
    }
    if (hist[file].index < allocatedHistory) {
      hist[file].index++;
    }
    if ((hist[file].data.length - 1) != hist[file].index) {
      hist[file].data.length = hist[file].index;
      hist[file].data.push(fileData[file]);
    }
  }
  
  const undo = () => {
    if (hist[currentFile].data[hist[currentFile].index - 1] != undefined) {
      textarea.value = hist[currentFile].data[hist[currentFile].index - 1];
      hist[currentFile].index--;
    }
    textarea.oninput(undefined, true);
  }
  
  const redo = () => {
    if (hist[currentFile].data[hist[currentFile].index + 1] != undefined) {
      textarea.value = hist[currentFile].data[hist[currentFile].index + 1];
      hist[currentFile].index++;
    }
    textarea.oninput(undefined, true);
  }
  
  // Code preview
  const updatePreview = () => {
    let extension;
    try {
      extension = currentFile.substring(currentFile.lastIndexOf('.') + 1, currentFile.length);
    } catch (err) {}
    if (extension == "html") {
      preview.srcdoc = fileData[currentFile];
      preview.style.display = "initial";
    } else if (extension == "svg") {
      preview.srcdoc = fileData[currentFile] + `<style>body{height: 100vh;width:100vw;margin:0;display:flex;align-items:center;justify-content:center} svg{max-height:100vh;max-width:100vw;}</style>`;
      preview.style.display = "initial";
    } else if (["png", "jpg", "jpeg", "tif", "tiff", "bmp", "ico", "webp"].includes(extension)) {
      preview.srcdoc = `<img src="${fileData[currentFile]}"><style>body{height: 100vh;width:100vw;margin:0;display:flex;align-items:center;justify-content:center} img{max-height:100vh;max-width:100vw;}</style>`;
      preview.style.display = "initial";
    } else {
      preview.style.display = "none";
    }
  }
  
  // New file
  byId("new").onclick = () => {
    workspace.setPage("newFile");
  }
  
  // New file
  const newFile = (name, content) => {
    if (fileData[name] == undefined) {
      fileData[name] = content;
      createFileButton(name);
    } else {
      alert(`${name} already exists.`);
    }
    localStorage.setItem("fileData", JSON.stringify(fileData));
    updateStorageBar("local", checkSpace());
  }
  
  // Detect "new" button click
  byId("new-createNew").onclick = () => {
    let name = prompt("What do you want to name your file?");
    if (name != null && name != "undefined") {
      if (name == undefined || name == "") {
        name = `${new Date().toISOString()}.txt`;
      }
      newFile(name, "");
      selectFile(name);
    } else if (name == "undefined") {
      window.alert("What the fuck?!");
    }
  };
  
  // Upload files
  const uploadFile = (input) => {
    for (let i in input.files) {
      let file = input.files[i];
      let reader = new FileReader();
      try {
        if (file["type"].split("/")[0] == "image" && file["type"] != "image/svg" && file["type"] != "image/svg+xml") {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      } catch (err) {}
      reader.onload = () => {
        if (fileData[file.name] == undefined && file.name != "undefined") {
          newFile(file.name, reader.result);
          selectFile(file.name);
        } else if (file.name == "undefined") {
              window.alert("What the fuck are you doing? Good grief...");
            } else if (confirm(`Do you want to overwrite ${file.name}?`)) {
          deleteFile(file.name);
          newFile(file.name, reader.result);
          selectFile(file.name);
        } else {
          alert(`${file.name} already exists.`);
        }
        delete reader;
      }
    }
  }
  
  // Detect "upload" button click
  byId("new-upload").onclick = () => {
    byId("fileReader").click();
  }
  
  // Upload files via drop
  window.ondrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    byId("fileDrop").classList.remove("ready");
    let transfer = event.dataTransfer;
    for (let i in transfer.files) {
      if (transfer.files[i].type != undefined) {
        let file = transfer.files[i]
        let reader = new FileReader();
        if (file["type"].split("/")[0] == "image" && file["type"] != "image/svg" && file["type"] != "image/svg+xml") {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
        reader.onload = () => {
          if (fileData[file.name] == undefined && file.name != "undefined") {
            newFile(file.name, reader.result);
            selectFile(file.name);
          } else if (file.name == "undefined") {
                  window.alert("Why do you do this? This behaviour is uncalled for!")
          } else if (confirm(`Do you want to overwrite ${file.name}?`)) {
            let lastFile = currentFile;
            deleteFile(file.name);
            newFile(file.name, reader.result);
            selectFile(file.name);
          } else {
            alert(`${file.name} already exists.`);
          }
        }
      }
    }
  }
  
  window.ondragover = (event) => {
    byId("fileDrop").classList.add("ready");
    event.preventDefault();
    event.stopPropagation();
  }
  
  byId("fileDrop").ondragleave = (event) => {
    byId("fileDrop").classList.remove("ready");
    event.preventDefault();
  }
  
  // Renaming files
  const renameFile = async (before, after) => {
    let temp = fileData[before];
    deleteFile(before);
    newFile(after, temp);
    selectFile(after);
  }
  
  // Detect "delete" button click
  byId("rename").onclick = () => {
    if (currentFile != undefined) {
      let name = prompt("What should your file's new name be?");
      if (name != null && name != undefined && name != "" && currentFile != undefined && name != "undefined") {
        renameFile(currentFile, name);
      } else if (name == "undefined") {
        window.alert("What the fuck?!");
      }
    } else {
      alert("You can't rename something that's nonexistent.");
    }
  };
  
  // Export files
  const exportFile = (name, content) => {
    let ext = name.substring(name.lastIndexOf(".") + 1, name.length);
    let imgExt = ["png", "jpg", "jpeg", "tif", "tiff", "bmp", "ico", "webp"];
    let blob = new Blob([content], {
      type: "text/plain"
    });
    let dl = document.createElement("a");
    dl.download = name;
    dl.href = imgExt.includes(ext) ? content : window.URL.createObjectURL(blob);
    dl.target = "_blank";
    dl.click();
    dl.remove();
  }
  
  // Detect "export" button click
  byId("export").onclick = () => {
    if (currentFile != undefined) {
      exportFile(currentFile, textarea.value);
    } else {
      alert("You can't export the empty void.");
    }
  }
  
  // Deleting files
  const deleteFile = (name) => {
    currentFile = undefined;
    try {
      delete fileData[name];
      byId("FILE:" + name).remove();
    } catch (err) {
      alert("You can't delete a file that doesn't exist.");
    }
    localStorage.setItem("fileData", JSON.stringify(fileData));
    updateStorageBar("local", checkSpace());
  }
  
  // Detect "delete" button click
  byId("delete").onclick = () => {
    if (currentFile != undefined) {
      if (confirm(`Are you sure you want to delete ${currentFile}?`)) {
        deleteFile(currentFile);
        workspace.setPage("newFile")
      }
    } else {
      alert("You can't delete the abyssal nothingness.");
    }
  }
  
  // Detect "settings" button click
  byId("settings").onclick = () => {
    workspace.setPage("settingsArea");
  }
  
  const checkSpace = () => {
    let data = "";
    for (let i in localStorage) {
      if (localStorage.hasOwnProperty(i)) {
        data += localStorage[i];
      }
    }
    return data.length;
  };
  
  const getSizeType = (bytes, decimals = 2) => {
    if (bytes === 0) {
      return '0B';
    }
    let k = 1000;
    let dm = decimals < 0 ? 0 : decimals;
    let sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
  }
  
  let updateStorageBar = (name, size) => {
    let percent = (size / 4000000) * 100;
    percent = Math.ceil(percent * 10) / 10;
    byId(`meter-${name}-amount`).style.width = percent + "%";
    byId(`meter-${name}-count`).innerHTML = getSizeType(size);
    if (percent >= 50) {
      if (percent >= 75) {
        byId(`meter-${name}`).classList.remove("caution");
        byId(`meter-${name}`).classList.add("warning");
      } else {
        byId(`meter-${name}`).classList.add("caution");
        byId(`meter-${name}`).classList.remove("warning");
      }
    } else {
      byId(`meter-${name}`).classList.remove("caution");
      byId(`meter-${name}`).classList.remove("warning");
    }
  }
  
  // Quick search aka finder
  finder.open = () => {
    if (finder.style.display != "flex") {
      let actions = {
        new: {
          name: "Create a new file",
          func: `byId("new-createNew").click()`
        },
        upload: {
          name: "Upload a file from your computer",
          func: `byId("new-upload").click()`
        },
        rename: {
          name: `Rename ${currentFile}`,
          func: `byId("rename").click()`
        },
        export: {
          name: `Download ${currentFile} to your computer`,
          func: `byId("export").click()`
        },
        delete: {
          name: `Delete ${currentFile}`,
          func: `byId("delete").click()`
        },
        settings: {
          name: "Open settings",
          func: `workspace.setPage("settingsArea")`
        },
        sidebar: {
          name: `${byId("main").style.transform == "" ? "Close" : "Open"} the sidebar`,
          func: `byId("currentFile").click();`
        },
        lightMode: {
          name: "Turn on light mode",
          func: `switchTheme("light")`
        },
        darkMode: {
          name: "Turn on dark mode",
          func: `switchTheme("dark")`
        },
        customTheme: {
          name: "Enable your custom theme",
          func: `switchTheme("custom")`
        }
      }
      byId("results").innerHTML += `<div id="noResultsFound">We couldn't find anything based on your search!</div>`;
      byId("results").innerHTML += `<h4 id="finder-files-title">Files</h4>`;
      let list = document.createElement("ul");
      list.id = "finder-files";
      for (let [key, value] of Object.entries(fileData)) {
        list.innerHTML += templates.finderFile(key);
      }
      byId("results").appendChild(list);
      byId("results").innerHTML += `<h4 id="finder-actions-title">Actions</h4>`;
      list = document.createElement("ul");
      list.id = "finder-actions";
      for (let i in actions) {
        list.innerHTML += `<li onclick='${actions[i].func};finder.close()' tabindex='0'>${actions[i].name}</li>`;
      }
      byId("results").appendChild(list);
      byId("results").innerHTML += `<h4 id="finder-find-title"></h4>`;
      list = document.createElement("ul");
      list.id = "finder-find";
      byId("results").appendChild(list);
      finder.style.display = "flex";
      byId("search").focus();
      byId("search").select();
      for (i = 0; i < finder.getElementsByTagName("li").length; i++) {
        finder.getElementsByTagName("li")[i].onkeydown = (event) => {
          if (event.keyCode == 13) {
            event.target.click();
          }
        }
      }
      
      let narrowList = () => {
        // Find files which names contain search query
        let inThis = 0;
        for (i = 0; i < byId("finder-files").children.length; i++) {
          let item = byId("finder-files").children[i];
          item.style.display = item.innerText.toUpperCase().indexOf(byId("search").value.toUpperCase()) > -1 ? null : "none";
          if (item.innerText.toUpperCase().indexOf(byId("search").value.toUpperCase()) > -1) {
            inThis++
          }
        }
        for (i = 0; i < byId("finder-files").getElementsByTagName("li").length; i++) {
          byId("finder-files").getElementsByTagName("li")[i].onkeydown = (event) => {
            if (event.keyCode == 13) {
              event.preventDefault();
              event.target.click();
            }
          }
        }
        byId("finder-files").style.display = byId("finder-files-title").style.display = (inThis < 1) ? "none" : null;
        // Find actions which names contain search query
        inThis = 0;
        for (i = 0; i < byId("finder-actions").children.length; i++) {
          let item = byId("finder-actions").children[i];
          item.style.display = item.innerText.toUpperCase().indexOf(byId("search").value.toUpperCase()) > -1 ? null : "none";
          if (item.innerText.toUpperCase().indexOf(byId("search").value.toUpperCase()) > -1) {
            inThis++
          }
        }
        for (i = 0; i < byId("finder-actions").getElementsByTagName("li").length; i++) {
          byId("finder-actions").getElementsByTagName("li")[i].onkeydown = (event) => {
            if (event.keyCode == 13) {
              event.preventDefault();
              event.target.click();
            }
          }
        }
        byId("finder-actions").style.display = byId("finder-actions-title").style.display = (inThis < 1) ? "none" : null;
        // Find indices of search query
        let getIndices = (search, string) => {
                if (search.length == 0) {
                  return;
                }
                let i = 0;
                let index, indices = [];
                string = string.toLowerCase();
                search = search.toLowerCase();
                while ((index = string.indexOf(search, i)) > -1) {
                  indices.push(index);
                  i = index + search.length;
                }
                return indices;
              }
        byId("finder-find-title").innerHTML = `Occurences of ${byId("search").value}`;
        byId("finder-find").style.display = byId("finder-find-title").style.display = (byId("search").value == "") ? "none" : null;
        inThis = 0;
        byId("finder-find").innerHTML = "";
        for (let [key, value] of Object.entries(fileData)) {
          let resInFile = 0;
            if (byId("search").value.length < 3) {
                break;
            }
          let indices = getIndices(byId("search").value, value);
          for (let i in indices) {
            if (i == 0) {
                resInFile = 0;
            }
            byId("finder-find").innerHTML += `<li onclick="selectFile('${key}', ${indices[i]}, ${indices[i] + byId("search").value.length}); finder.close()" tabindex="0">${key}<span class="tag">${indices[i]}</span></li>`;
            inThis++;
            resInFile++;
          }
        }
        for (i = 0; i < byId("finder-find").getElementsByTagName("li").length; i++) {
          byId("finder-find").getElementsByTagName("li")[i].onkeydown = (event) => {
            if (event.keyCode == 13) {
              event.preventDefault();
              event.target.click();
            }
          }
        }
        byId("finder-find").style.display = byId("finder-find-title").style.display = (inThis < 1) ? "none" : null;
        byId("noResultsFound").style.display = (byId("finder-find").style.display == "none" && byId("finder-files").style.display == "none" && byId("finder-actions").style.display == "none") ? "block" : null;
      }
      narrowList();
      
      byId("search").oninput = narrowList;
    } else {
      finder.close();
    }
  }
  
  finder.close = (event) => {
    try {
      if (finder == event.target) {
        finder.style.display = null;
        byId("results").innerHTML = "";
      }
    } catch (err) {
      finder.style.display = null;
      byId("results").innerHTML = "";
    }
  }
  
  finder.onclick = finder.close;
  finder.onkeydown = (event) => {
    if (event.key == "Escape") {
      finder.close();
    } else if (event.key != "Tab" && !event.shiftKey) {
      byId("search").focus();
      if (event.target != byId("search")) {
        byId("search").select();
      }
    }
  }
  
  // Shortcuts
  document.onkeydown = (event) => {
    if (event.key == "Tab") {
      if (finder.style.display != "none") {
        let selector = `#finder [tabindex]:not([tabindex="-1"]):not([style="display: none;"]), #finder input`;
        let focusableContent = document.querySelectorAll(selector);
        let firstFocusableElement = focusableContent[0];
        let lastFocusableElement = focusableContent[focusableContent.length - 1];
        if (event.shiftKey) {
          if (document.activeElement == firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else if (document.activeElement == lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement.focus();
          event.preventDefault();
        }
      }
    } else if (event.ctrlKey && event.altKey && event.key == "n") {
      event.preventDefault();
      document.getElementById("new").click();
    } else if (event.ctrlKey && event.key == "\\") {
      event.preventDefault();
      document.getElementById("rename").click();
    } else if (event.ctrlKey && event.shiftKey && event.keyCode == "40") {
      event.preventDefault();
      document.getElementById("export").click();
    } else if (event.ctrlKey && event.shiftKey && event.keyCode == "8" ||
      event.ctrlKey && event.shiftKey && event.keyCode == "46") {
      event.preventDefault();
      document.getElementById("delete").click();
    } else if (event.ctrlKey && event.shiftKey && event.keyCode == "8" ||
      event.ctrlKey && event.keyCode == "13") {
      event.preventDefault();
      updatePreview();
    } else if ((event.ctrlKey && event.key == "z") && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (event.ctrlKey && (event.shiftKey && event.key == "z" || event.key == "y")) {
      event.preventDefault();
      redo();
    } else if (event.ctrlKey && event.key == "k") {
      event.preventDefault();
      finder.open();
    }
  };
  
  // Smartkeys
  textarea.onkeydown = (event) => {
    let pv = () => {
      event.preventDefault();
    }
  
    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
  
    switch (event.key) {
      case "Tab":
        pv();
        textarea.value = textarea.value.substring(0, start) + ` `.repeat(tabSize) + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + Number(tabSize);
        break;
      case "{":
        pv();
        if (Math.abs(textarea.value.substring(start, end).length) != 0) {
          textarea.value = `${textarea.value.substring(0, start)}{${textarea.value.substring(start, end)}}${textarea.value.substring(end)}`;
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        } else {
          textarea.value = textarea.value.substring(0, start) + `{}` + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        break;
      case "}":
        if (Math.abs(textarea.value.substring(start, end).length) == 0) {
          if (textarea.value.substring(end).slice(0, 1) == `}`) {
            pv();
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }
        }
        break;
      case "(":
        pv();
        if (Math.abs(textarea.value.substring(start, end).length) != 0) {
          textarea.value = `${textarea.value.substring(0, start)}(${textarea.value.substring(start, end)})${textarea.value.substring(end)}`;
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        } else {
          textarea.value = textarea.value.substring(0, start) + `()` + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        break;
      case ")":
        if (Math.abs(textarea.value.substring(start, end).length) == 0) {
          if (textarea.value.substring(end).slice(0, 1) == `)`) {
            pv();
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }
        }
        break;
      case "[":
        pv();
        if (Math.abs(textarea.value.substring(start, end).length) != 0) {
          textarea.value = `${textarea.value.substring(0, start)}[${textarea.value.substring(start, end)}]${textarea.value.substring(end)}`;
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        } else {
          textarea.value = textarea.value.substring(0, start) + `[]` + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        break;
      case "]":
        if (Math.abs(textarea.value.substring(start, end).length) == 0) {
          if (textarea.value.substring(end).slice(0, 1) == `]`) {
            pv();
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }
        }
        break;
      case "<":
        pv();
        if (Math.abs(textarea.value.substring(start, end).length) != 0) {
          textarea.value = `${textarea.value.substring(0, start)}<${textarea.value.substring(start, end)}>${textarea.value.substring(end)}`;
          textarea.selectionStart = start + 1;
          textarea.selectionEnd = end + 1;
        } else {
          textarea.value = textarea.value.substring(0, start) + `<>` + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        break;
      case ">":
        if (Math.abs(textarea.value.substring(start, end).length) == 0) {
          if (textarea.value.substring(end).slice(0, 1) == `>`) {
            pv();
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }
        }
        break;
    }
    if ("(){}[]<>".includes(event.key) || event.key == "Tab") {
      textarea.oninput(event);
    }
  }
  
  ////////////////////
  
  const flyUp = (element) => {
    element.classList.remove("animation-flyUp");
    element.classList.add("animation-flyUp");
    setTimeout(() => {
      element.classList.remove("animation-flyUp");
    }, 500)
  }
  
  setTimeout(() => {}, 2500)
