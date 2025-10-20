drop procedure if exists add_admin_state;

delimiter //
create procedure add_admin_state()
begin

if not exists (select * from information_schema.columns
    where column_name = 'admin_state' and table_name = 'aps' and table_schema = DATABASE()) then
    alter table aps ADD COLUMN admin_state ENUM('active','suspended','inactive') NOT NULL DEFAULT 'active';
end if;

if not exists (select * from information_schema.columns
    where column_name = 'for_suspended' and table_name = 'ap_profile_exits' and table_schema = DATABASE()) then
    alter table ap_profile_exits add column `for_suspended` tinyint(1) NOT NULL DEFAULT '0';
end if;

if not exists (select * from information_schema.columns
    where column_name = 'admin_state' and table_name = 'nodes' and table_schema = DATABASE()) then
    alter table nodes ADD COLUMN admin_state ENUM('active','suspended','inactive') NOT NULL DEFAULT 'active';
end if;

if not exists (select * from information_schema.columns
    where column_name = 'for_suspended' and table_name = 'mesh_exits' and table_schema = DATABASE()) then
    alter table mesh_exits add column `for_suspended` tinyint(1) NOT NULL DEFAULT '0';
end if;


end//

delimiter ;
call add_admin_state;
