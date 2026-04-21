function listProjectsController(filters) {
  try {
    return ApiResponse.success(ProjectService.listProjects(filters || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveProjectController(payload) {
  try {
    return ApiResponse.success(ProjectService.saveProject(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function getProjectDetailController(projectId) {
  try {
    return ApiResponse.success(ProjectService.getProjectDetail(projectId, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveTaskController(payload) {
  try {
    return ApiResponse.success(ProjectService.saveTask(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function saveAdvanceController(payload) {
  try {
    return ApiResponse.success(ProjectService.saveAdvance(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
