package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsExportGateway;
import com.billu.accounts.domain.AccountsExportRequest;
import com.billu.accounts.domain.AccountsExportResult;

public class OracleAccountsExportRepository implements AccountsExportGateway {
  @Override
  public AccountsExportResult exportData(AccountsExportRequest request) {
    throw new IllegalStateException("Oracle customer summary export projection is not implemented yet.");
  }
}
