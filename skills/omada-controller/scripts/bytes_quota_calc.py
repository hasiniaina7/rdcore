#!/usr/bin/env python3
import argparse

DEC_MB = 1_000_000
DEC_GB = 1_000_000_000
BIN_MIB = 1_048_576
BIN_GIB = 1_073_741_824
U32 = 4_294_967_296


def main() -> int:
    p = argparse.ArgumentParser(
        description=(
            "Convert RADIUS octet accounting into bytes/MB/MiB/GB/GiB. "
            "Handles Gigawords rollover for 32-bit counters."
        )
    )
    p.add_argument("--input-octets", type=int, default=0)
    p.add_argument("--output-octets", type=int, default=0)
    p.add_argument("--input-gigawords", type=int, default=0)
    p.add_argument("--output-gigawords", type=int, default=0)
    args = p.parse_args()

    in_bytes = args.input_octets + args.input_gigawords * U32
    out_bytes = args.output_octets + args.output_gigawords * U32
    total = in_bytes + out_bytes

    print(f"input_bytes={in_bytes}")
    print(f"output_bytes={out_bytes}")
    print(f"total_bytes={total}")
    print(f"total_MB_decimal={total / DEC_MB:.6f}")
    print(f"total_GB_decimal={total / DEC_GB:.6f}")
    print(f"total_MiB_binary={total / BIN_MIB:.6f}")
    print(f"total_GiB_binary={total / BIN_GIB:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
