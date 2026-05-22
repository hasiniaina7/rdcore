<?php

namespace App\Shell;

use Cake\Console\Shell;
use Cake\Datasource\ConnectionManager;

class FupMonthlyResetShell extends Shell
{
    public function initialize(): void
    {
        parent::initialize();
    }

    public function main()
    {
        $conn = ConnectionManager::get('default');

        // Reset data usage cache for FUP profiles that define monthly data reset.
        $sqlData = "
            UPDATE permanent_users pu
            JOIN radusergroup rug ON rug.username = pu.profile
            JOIN radgroupcheck rgc ON rgc.groupname = rug.groupname
            SET pu.data_used = 0,
                pu.perc_data_used = 0,
                pu.modified = NOW()
            WHERE rug.groupname LIKE 'FupAdd_%'
              AND rgc.attribute = 'Rd-Reset-Type-Data'
              AND rgc.value = 'monthly'
        ";
        $conn->execute($sqlData);

        // Reset time usage cache for FUP profiles that define monthly time reset.
        $sqlTime = "
            UPDATE permanent_users pu
            JOIN radusergroup rug ON rug.username = pu.profile
            JOIN radgroupcheck rgc ON rgc.groupname = rug.groupname
            SET pu.time_used = 0,
                pu.perc_time_used = 0,
                pu.modified = NOW()
            WHERE rug.groupname LIKE 'FupAdd_%'
              AND rgc.attribute = 'Rd-Reset-Type-Time'
              AND rgc.value = 'monthly'
        ";
        $conn->execute($sqlTime);

        $this->out('<info>FUP monthly reset completed</info>');
    }
}

?>
