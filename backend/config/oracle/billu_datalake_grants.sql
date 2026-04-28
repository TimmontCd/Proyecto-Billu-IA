-- Grants and synonyms for the local application user.
-- Run as SYSTEM after DLK_* tables are created.

WHENEVER SQLERROR EXIT SQL.SQLCODE
SET SERVEROUTPUT ON

DECLARE
  v_user_count NUMBER;
BEGIN
  SELECT COUNT(*)
    INTO v_user_count
    FROM ALL_USERS
   WHERE USERNAME = 'BILLU_READ';

  IF v_user_count = 0 THEN
    DBMS_OUTPUT.PUT_LINE('User BILLU_READ does not exist; skipping grants.');
    RETURN;
  END IF;

  FOR table_record IN (
    SELECT TABLE_NAME
      FROM USER_TABLES
     WHERE TABLE_NAME LIKE 'DLK\_%' ESCAPE '\'
     ORDER BY TABLE_NAME
  ) LOOP
    EXECUTE IMMEDIATE 'GRANT SELECT, INSERT, UPDATE, DELETE ON '
        || table_record.TABLE_NAME || ' TO BILLU_READ';
    EXECUTE IMMEDIATE 'CREATE OR REPLACE SYNONYM BILLU_READ.'
        || table_record.TABLE_NAME || ' FOR SYSTEM.' || table_record.TABLE_NAME;
    DBMS_OUTPUT.PUT_LINE('Granted and synonymized ' || table_record.TABLE_NAME);
  END LOOP;
END;
/

COMMIT;
EXIT;
