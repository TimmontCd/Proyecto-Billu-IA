package com.billu.accounts.infrastructure.oracle;

import com.billu.accounts.application.AccountsCardCoverageGateway;
import com.billu.accounts.domain.CardCoverageSnapshot;
import com.billu.foundation.infrastructure.oracle.OracleConnectionFactory;
import com.billu.foundation.infrastructure.oracle.OracleRepositorySupport;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class OracleAccountsCardCoverageRepository extends OracleRepositorySupport
    implements AccountsCardCoverageGateway {
  private static final String COVERAGE_SQL =
      "SELECT "
          + "SUM(CASE WHEN NVL(HAS_PHYSICAL_CARD_FLAG, 'N') = 'Y' "
          + "    OR NVL(HAS_DIGITAL_CARD_FLAG, 'N') = 'Y' THEN 1 ELSE 0 END) AS covered_accounts, "
          + "SUM(CASE WHEN NVL(HAS_PHYSICAL_CARD_FLAG, 'N') = 'N' "
          + "    AND NVL(HAS_DIGITAL_CARD_FLAG, 'N') = 'N' THEN 1 ELSE 0 END) AS uncovered_accounts, "
          + "SUM(CASE WHEN NVL(HAS_RECENT_PHYSICAL_USAGE_FLAG, 'N') = 'Y' "
          + "    OR NVL(HAS_RECENT_DIGITAL_USAGE_FLAG, 'N') = 'Y' THEN 1 ELSE 0 END) "
          + "    AS transactional_accounts, "
          + "SUM(CASE WHEN (NVL(HAS_PHYSICAL_CARD_FLAG, 'N') = 'Y' "
          + "    OR NVL(HAS_DIGITAL_CARD_FLAG, 'N') = 'Y') "
          + "    AND (NVL(HAS_RECENT_PHYSICAL_USAGE_FLAG, 'N') = 'Y' "
          + "    OR NVL(HAS_RECENT_DIGITAL_USAGE_FLAG, 'N') = 'Y') THEN 1 ELSE 0 END) "
          + "    AS covered_transactional_accounts, "
          + "MAX(LOADED_AT) AS generated_at "
          + "FROM DLK_CARD_STATUS "
          + "WHERE CUT_DATE = (SELECT MAX(CUT_DATE) FROM DLK_CARD_STATUS)";

  public OracleAccountsCardCoverageRepository(String environment, String url, String user,
      String password) {
    super(environment, url, user, password);
  }

  OracleAccountsCardCoverageRepository(String environment, String url, String user, String password,
      OracleConnectionFactory connectionFactory) {
    super(environment, url, user, password, connectionFactory);
  }

  @Override
  public CardCoverageSnapshot getCoverage() {
    try (Connection connection = openConnection();
         PreparedStatement statement = connection.prepareStatement(COVERAGE_SQL);
         ResultSet resultSet = statement.executeQuery()) {
      if (!resultSet.next()) {
        return emptyCoverage();
      }
      int coveredAccounts = resultSet.getInt("covered_accounts");
      int uncoveredAccounts = resultSet.getInt("uncovered_accounts");
      int transactionalAccounts = resultSet.getInt("transactional_accounts");
      int coveredTransactionalAccounts = resultSet.getInt("covered_transactional_accounts");
      Timestamp generatedAt = resultSet.getTimestamp("generated_at");
      return new CardCoverageSnapshot(
          getEnvironment(),
          coveredAccounts,
          uncoveredAccounts,
          transactionalAccounts,
          coveredTransactionalAccounts,
          buildSegments(coveredAccounts, uncoveredAccounts, coveredTransactionalAccounts),
          toInstant(generatedAt, Instant.now()));
    } catch (SQLException exception) {
      throw queryFailure("Unable to read Oracle customer summary card coverage projection",
          exception);
    }
  }

  private CardCoverageSnapshot emptyCoverage() {
    return new CardCoverageSnapshot(
        getEnvironment(),
        0,
        0,
        0,
        0,
        buildSegments(0, 0, 0),
        Instant.now());
  }

  private List<Map<String, Object>> buildSegments(int coveredAccounts, int uncoveredAccounts,
      int coveredTransactionalAccounts) {
    int dormantAccounts = coveredAccounts - coveredTransactionalAccounts;
    int totalAccounts = coveredAccounts + uncoveredAccounts;
    List<Map<String, Object>> segments = new ArrayList<Map<String, Object>>();
    segments.add(segment("ACTIVE_CARD", coveredTransactionalAccounts, totalAccounts));
    segments.add(segment("DORMANT_CARD", dormantAccounts, totalAccounts));
    segments.add(segment("NO_CARD", uncoveredAccounts, totalAccounts));
    return segments;
  }

  private Map<String, Object> segment(String label, int accounts, int totalAccounts) {
    Map<String, Object> value = new LinkedHashMap<String, Object>();
    value.put("segment", label);
    value.put("accounts", Integer.valueOf(Math.max(accounts, 0)));
    value.put("sharePct", Double.valueOf(pct(Math.max(accounts, 0), totalAccounts)));
    return value;
  }
}
