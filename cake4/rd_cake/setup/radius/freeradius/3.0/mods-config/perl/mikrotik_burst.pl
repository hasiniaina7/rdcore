use strict;
use warnings;

use constant RLM_MODULE_OK => 2;
use constant RLM_MODULE_NOOP => 7;

our (%RAD_REQUEST, %RAD_REPLY, %RAD_CHECK);

my $DEFAULT_BURST_LIMIT_PERCENT = 100;
my $DEFAULT_BURST_THRESHOLD_PERCENT = 100;
my $DEFAULT_BURST_TIME = 30;

sub authorize { return RLM_MODULE_NOOP; }
sub authenticate { return RLM_MODULE_NOOP; }
sub accounting { return RLM_MODULE_NOOP; }
sub preacct { return RLM_MODULE_NOOP; }
sub detach { return RLM_MODULE_OK; }

sub post_auth {
    return RLM_MODULE_NOOP if defined $RAD_REPLY{'Mikrotik-Rate-Limit'};
    return RLM_MODULE_NOOP if !defined $RAD_CHECK{'Tmp-String-0'};
    return RLM_MODULE_NOOP if $RAD_CHECK{'Tmp-String-0'} ne 'Mikrotik-API';
    return RLM_MODULE_NOOP if !defined $RAD_REPLY{'WISPr-Bandwidth-Max-Up'};
    return RLM_MODULE_NOOP if !defined $RAD_REPLY{'WISPr-Bandwidth-Max-Down'};

    my $up_bps = int($RAD_REPLY{'WISPr-Bandwidth-Max-Up'});
    my $down_bps = int($RAD_REPLY{'WISPr-Bandwidth-Max-Down'});
    return RLM_MODULE_NOOP if $up_bps <= 0 || $down_bps <= 0;

    my ($up_value, $up_suffix) = _format_mikrotik_rate($up_bps);
    my ($down_value, $down_suffix) = _format_mikrotik_rate($down_bps);

    my $burst_up = int($up_value + ($up_value * ($DEFAULT_BURST_LIMIT_PERCENT / 100)));
    my $burst_down = int($down_value + ($down_value * ($DEFAULT_BURST_LIMIT_PERCENT / 100)));
    my $threshold_up = int($up_value * ($DEFAULT_BURST_THRESHOLD_PERCENT / 100));
    my $threshold_down = int($down_value * ($DEFAULT_BURST_THRESHOLD_PERCENT / 100));

    $RAD_REPLY{'Mikrotik-Rate-Limit'} =
        "$up_value$up_suffix/$down_value$down_suffix " .
        "$burst_up$up_suffix/$burst_down$down_suffix " .
        "$threshold_up$up_suffix/$threshold_down$down_suffix " .
        "$DEFAULT_BURST_TIME/$DEFAULT_BURST_TIME";

    return RLM_MODULE_OK;
}

sub _format_mikrotik_rate {
    my ($bps) = @_;
    my $value = int($bps);
    my $suffix = '';

    if (($value / 1024) >= 1) {
        $value = $value / 1024;
        $suffix = 'k';
    }
    if (($value / 1024) >= 1) {
        $value = $value / 1024;
        $suffix = 'M';
    }

    return (int($value), $suffix);
}
