var DriveService = (function () {
  function getFolderIdByKey(key) {
    return AppConfig.get('FOLDER_' + key + '_ID', '');
  }

  function getFolderByKey(key) {
    var folderId = getFolderIdByKey(key);
    if (!folderId) throw new Error('Folder not configured for key: ' + key);
    return DriveApp.getFolderById(folderId);
  }

  function saveBase64File(folderKey, fileName, mimeType, base64Content) {
    var folder = getFolderByKey(folderKey);
    var decoded = Utilities.base64Decode(base64Content);
    var blob = Utilities.newBlob(decoded, mimeType || MimeType.PLAIN_TEXT, fileName);
    var file = folder.createFile(blob);
    return {
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      size: file.getSize(),
      mimeType: file.getMimeType()
    };
  }

  function moveFileToFolder(fileId, folderKey) {
    var file = DriveApp.getFileById(fileId);
    var folder = getFolderByKey(folderKey);
    folder.addFile(file);
    try {
      DriveApp.getRootFolder().removeFile(file);
    } catch (error) {
      Logger.log('Root folder remove skipped: ' + error.message);
    }
    return file;
  }

  function createSubfolder(parentKey, name) {
    var parent = getFolderByKey(parentKey);
    return parent.createFolder(name);
  }

  function getDownloadUrlAsDocx(fileId) {
    return 'https://docs.google.com/document/d/' + fileId + '/export?format=docx';
  }

  return {
    getFolderByKey: getFolderByKey,
    saveBase64File: saveBase64File,
    moveFileToFolder: moveFileToFolder,
    createSubfolder: createSubfolder,
    getDownloadUrlAsDocx: getDownloadUrlAsDocx
  };
})();
