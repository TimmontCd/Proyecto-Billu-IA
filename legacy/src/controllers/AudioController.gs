function uploadAudioController(payload) {
  try {
    return ApiResponse.success(AudioService.uploadAndTranscribe(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}

function generateMinuteController(payload) {
  try {
    return ApiResponse.success(AudioService.generateMinuteFromAudio(payload || {}, AuthService.getUserContext()));
  } catch (error) {
    return ApiResponse.error(error.message);
  }
}
