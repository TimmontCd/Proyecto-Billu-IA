package com.billu.accounts.infrastructure.mock;

import com.billu.accounts.application.AccountsSummaryGateway;
import com.billu.accounts.application.AccountsHistoricalGateway;
import com.billu.accounts.domain.CustomerSummaryFirst30View;
import com.billu.accounts.domain.CustomerSummaryHistoricalView;
import com.billu.accounts.domain.CustomerAccountSummary;
import java.io.IOException;

public class MockAccountsDatasetLoader implements AccountsSummaryGateway, AccountsHistoricalGateway {
  private final MockAccountsSummaryRepository repository;
  private final MockAccountsHistoricalRepository historicalRepository;

  public MockAccountsDatasetLoader(MockAccountsSummaryRepository repository) {
    this(repository, new MockAccountsHistoricalRepository());
  }

  public MockAccountsDatasetLoader(MockAccountsSummaryRepository repository,
      MockAccountsHistoricalRepository historicalRepository) {
    this.repository = repository;
    this.historicalRepository = historicalRepository;
  }

  @Override
  public CustomerAccountSummary getOverview() {
    try {
      return repository.loadOverview();
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load customer summary mock dataset", exception);
    }
  }

  @Override
  public CustomerSummaryHistoricalView getHistorical(String startDate, String endDate) {
    try {
      return historicalRepository.loadHistorical();
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load customer summary historical mock dataset",
          exception);
    }
  }

  @Override
  public CustomerSummaryFirst30View getFirst30() {
    try {
      return historicalRepository.loadFirst30();
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to load customer summary first30 mock dataset",
          exception);
    }
  }
}
