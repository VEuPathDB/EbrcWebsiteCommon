
-- SQLs to run on account DB before dropping/recreating tables

create table useraccounts.new_accounts as (
  select * from useraccounts.accounts
  where user_id >= 378643033
     or (user_id >= 219798600 and mod(user_id,10) = 0));

create table useraccounts.new_account_properties as (
  select * from useraccounts.account_properties
  where user_id >= 378643033
     or (user_id >= 219798600 and mod(user_id,10) = 0));

-- SQLs to run on account DB after dropping/recreating tables from apicommN

insert into useraccounts.accounts (user_id, email, passwd, is_guest, signature, stable_id, register_time, last_login)
  select user_id, email, passwd, is_guest, signature, stable_id, register_time, last_login
  from useraccounts.new_accounts;

insert into useraccounts.account_properties (user_id, key, value)
  select user_id, key, value
  from useraccounts.new_account_properties;

-- SQLs to run on user DB whenever

insert into userlogins5.preferences (user_id, project_id, preference_name, preference_value)
  select user_id, '[Global]' as project_id, 'show-galaxy-orientation-page' as preference_name, 'false' as preference_value from (
    select distinct user_id
    from userlogins5.preferences
    where preference_name = 'show-galaxy-orientation-page'
  );

delete from userlogins5.preferences
where preference_name = 'show-galaxy-orientation-page'
  and project_id != '[Global]';
