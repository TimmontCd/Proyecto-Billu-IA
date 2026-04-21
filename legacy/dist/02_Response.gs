var ApiResponse = (function () {
  function success(data, message) {
    return {
      ok: true,
      message: message || '',
      data: data || {},
      timestamp: new Date().toISOString()
    };
  }

  function error(message, details) {
    return {
      ok: false,
      message: message || 'Unexpected error',
      details: details || null,
      timestamp: new Date().toISOString()
    };
  }

  return {
    success: success,
    error: error
  };
})();
