

// These are the tags at the beginning of a document DocSpider grabs and inserts into the web presentation
var applicationNameRegEx = /\[ApplicationName:(.*)\]/;
var applicationCategoryRegEx = /\[ApplicationCategory:(.*)\]/;
var applicationRepositoryRegEx = /\[ApplicationRepository:(.*)\]/;
var applicationDirectoryRegEx = /\[ApplicationDirectory:(.*)\]/;


/**
Prepare the index if no document was selected
*/
exports.index = function(req, res){
    getDocumentation('./views/staticDocs',
        function(files){
            res.render('doc', { title: 'DocSpider grabbed documentation', list: files });
        }
    )
};

/**
    View a specific doc or an associated image. The selection is based on the url path and will render if an entry is known. 
    Path traversal is possible so be sure to use this only with trusted users 
*/
exports.view  = function(req, res,next){
    if (req.params.docFile.match(/.*\.png/)){ next();}
    else {
        var md  = require('marked')
        ,fs     = require('fs');
        md.setOptions({
            gfm: true, 
            tables: true, 
            smartLists: true
        });
        getDocumentation('./views/staticDocs',
            function(files){
                fs.readFile('./views/staticDocs/'+req.params.docFile+'/'+req.params.docFile+".md", function (err, data) {
                    var appRepo
                    var appDir

                    if (err) 
                        console.log('could not show defined file '+
                            './views/staticDocs/'+
                            req.params.docFile+'/'+
                            req.params.docFile+".md")

                    if (data.toString().match(applicationRepositoryRegEx)!=null ) {
                        appRepo = data.toString().match(applicationRepositoryRegEx)[1].trim();
                    }
                    if (data.toString().match(applicationDirectoryRegEx)!=null ) {
                        appDir = data.toString().match(applicationDirectoryRegEx)[1].trim();
                    }
                    res.render('doc', { fileName: req.params.docFile, list: files, 
                        readme:md(
                            data.toString()
                            .replace(applicationNameRegEx,'')
                            .replace(applicationDirectoryRegEx,'')
                            .replace(applicationRepositoryRegEx,'')
                            .replace(applicationCategoryRegEx,'')), appRepo: appRepo, appDir:appDir 
                    });
                });
            }
        );
    }
};

// Helper that runs through the local documentation archive and creates a list of the documents.
// the generated output has a json representation of the document properties
//FIXME
// The documentation of the individual functions is not sufficient. 
// The program code needs further explanations
// as the complexity is currently to high

function getDocumentation(path, callback){
    var walk    = require('walk')
    ,md  = require('marked')
    ,fs         = require('fs');
    var files   = {};

    var walker = walk.walk(path, { followLinks: false });
    walker.on('file', function(root, stat, next) { 
        fs.readFile(root + '/' + stat.name, function (err, data) { 
            console.log('file:'+root+'/'+stat.name)
            if (err) console.log('something went wrong during gathering docs: '+err);
            else if (stat.name.match(/.*\.md/)) {
                var chapters = []
                var appCategory
                var appDocName = data.toString().match(applicationNameRegEx)[1].trim();
                var lexer = new md.Lexer();
                var tokens = lexer.lex(data.toString());

                tokens.forEach(function(element, index){
                    if (element.type == 'heading'){
                        chapters =  chapters.concat(element)
                    }
                })
                if (data.toString().match(applicationCategoryRegEx)!=null ) {
                    appCategory = data.toString().match(applicationCategoryRegEx)[1].trim();
                }
                if (typeof appCategory === "undefined" ){
                    appCategory = ''
                }     
                if (!files.hasOwnProperty(appCategory)){
                    files[appCategory] = [{ 
                        appName: appDocName,
                        docFilename: stat.name.replace(/\.md/,""),
                        chapters:chapters
                        }];
                } else {
                     files[appCategory] = files[appCategory].concat({ 
                        appName: appDocName,
                        docFilename: stat.name.replace(/\.md/,""),
                        chapters:chapters
                        });
                }
            }
            next();
            }
        );
    });
    walker.on('end', function() {
            callback(files);
    });
};

/**
    Send over an image (if present in document)
*/
exports.viewImage  = function(req, res){
    var express = require('express');
        res.sendfile('./views/staticDocs/'+
            req.get('referrer')
            .match(
                /\/([A-Za-z0-9]*$)/)[1]+'/'+req.params.docFile)
}

/**
    Recreate the index. This will first delete the current documentation and then
    kick of an asynchronous process (see collectDocumentation) which searches the defined repositories and copies them over
    to create an archived version of the documentation found.
*/
exports.update = function(req, res){
    var walk    = require('walk')
    ,fs         = require('fs')
    ,rmdir      = require('rimraf');
    var files   = [];

    var targetPath = './views/staticDocs/';
    fs.readdir(targetPath, 
        function(err,files){
        if (err) console.log('error while reading directory:'+err);
        else {
            console.log('deleting files: '+files)
            files.forEach(
                function(file, index) {
                rmdir(targetPath+file, function(err){
                    if (err) 
                        console.log('could not delete file '+file+': '+err);
                    else 
                        console.log('successfully deleted '+file);
                });
            })
        }
        fs.readFile('./repositories.json', function (err, data) {
        // Walker options
        configData =  JSON.parse(data);
        configData.files.forEach(
            function(startpath, index) {
            collectDocumentation(startpath,targetPath, 
                function(collected){
                files = files.concat(collected);
                if (index == 0){
                    res.render('update', {files: files});
                }
            });
        });
        });
    });


};

// Regex and FS based helper to find documentation on the specified repositories.
//FIXME
// The documentation of the individual functions is not sufficient. 
// The program code needs further explanations
// as the complexity is currently to high
function collectDocumentation(path, targetPath, callback){
    var walk    = require('walk')
    ,fs     = require('fs');
    var files   = [];
    var walker = walk.walk(path, { followLinks: false });
    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        if ( stat.name.match(/.*README.*\.md/)) {
            fs.readFile(root + '/' + stat.name, function (err, data) {
                var appDocName = data.toString().match(applicationNameRegEx);
                if (appDocName != null && appDocName[1]!=null && files.indexOf(root + '/' + stat.name)==-1){
                    console.info('found "'+appDocName[1].trim()+
                        '" at "'+ 
                        root + '/' 
                        + stat.name+'"');

                    files.push(root + '/' + stat.name);
                    fs.mkdir(targetPath+'/'+appDocName[1].trim()+'/', 

                        function (err) {
                        if (err) 
                            console.log('error while creating sub directorys: '+
                                targetPath+'/'+appDocName[1].trim()+
                                '/, most cerntainly this app-name already exists')

                        fs.createReadStream(root + '/' + stat.name)
                            .pipe(fs.createWriteStream(
                                targetPath+'/'+
                                appDocName[1].trim()+'/'+
                                appDocName[1].trim()+'.md'));

                        var images = /!\[.*\]\((.*)\)/g;
                        var singleImage = images.exec(data.toString());

                        while (singleImage != null && singleImage.length > 1 ) {
                            swapImage(singleImage,appDocName,targetPath)
                            singleImage = images.exec(data.toString());
                        }
                        
                    });
                }
                if (err) console.log('error while collecting data:' +err);
                next();
            });
        } else {
            next();
        }
    });

    walker.on('end', function() {
        callback(files);
    });
};

// Helper to create folders and copy over images
function swapImage(singleImage,appDocName,targetPath){
    var imagePath = singleImage[1]
    var mkDirName= targetPath+'/'+
        appDocName[1].trim()+'/'+
        imagePath.split("/").slice(
            1,imagePath.split("/").length)
        .join("/");

    console.log("Creating: "+mkDirName)
    fs.mkdir(mkDirName, 

        function (err) {
            if (err && !(err.code =='EEXIST')) 
                console.log('could not create image folder: '+
                    targetPath+'/'+
                    appDocName[1].trim()+'/'+
                    imagePath.split("/").slice(
                        1,imagePath.split("/").length)
                    .join("/")+', '+err) ;

            else 
                fs.createReadStream(root + '/' + imagePath)
                .pipe(fs.createWriteStream(
                    targetPath+'/'+
                    appDocName[1].trim()+'/'+
                    imagePath));
    })
}