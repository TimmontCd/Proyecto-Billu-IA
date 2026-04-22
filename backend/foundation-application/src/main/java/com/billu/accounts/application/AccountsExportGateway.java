package com.billu.accounts.application;

import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;

public interface AccountsExportGateway {
  AccountsExportResult exportData(AccountsExportRequest request);
}
