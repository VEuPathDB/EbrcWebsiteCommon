/*
 * This script resets the accounts sequence to the largest user_id in the
 * database + 10.  It works for both North and South databases but you MUST
 * choose the last_digit declaration below appropriately before running.
 * Comment the one you don't want and leave the other.
 */
DECLARE
  last_digit CONSTANT INTEGER := 0; -- use for acctDbN
  --last_digit CONSTANT INTEGER := 3; -- user for acctDbS
  sequence_name VARCHAR(100) := 'USERACCOUNTS.ACCOUNTS_PKSEQ';
  next_number INTEGER;
BEGIN
  SELECT max(user_id) + 10
  INTO next_number
  FROM USERACCOUNTS.ACCOUNTS
  WHERE mod(user_id, 10) = last_digit;

  EXECUTE IMMEDIATE
    'DROP SEQUENCE ' || sequence_name;

  EXECUTE IMMEDIATE
    'CREATE SEQUENCE ' || sequence_name ||
    ' START WITH ' || '220837500' ||
    ' INCREMENT BY 10' ||
    ' MINVALUE 1 MAXVALUE 9999999999999999999999999999' ||
    ' CACHE 20 NOORDER NOCYCLE';

  EXECUTE IMMEDIATE
    'GRANT SELECT ON ' || sequence_name || ' TO USERACCTS_W';

END;
