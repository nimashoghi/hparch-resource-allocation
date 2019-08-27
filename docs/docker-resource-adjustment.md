\> docker update --help

    Usage:  docker update [OPTIONS] CONTAINER [CONTAINER...]

    Update configuration of one or more containers

    Options:
        --blkio-weight uint16        Block IO (relative weight), between 10
                                    and 1000, or 0 to disable (default 0)
        --cpu-period int             Limit CPU CFS (Completely Fair
                                    Scheduler) period
        --cpu-quota int              Limit CPU CFS (Completely Fair
                                    Scheduler) quota
        --cpu-rt-period int          Limit the CPU real-time period in
                                    microseconds
        --cpu-rt-runtime int         Limit the CPU real-time runtime in
                                    microseconds
    -c, --cpu-shares int             CPU shares (relative weight)
        --cpus decimal               Number of CPUs
        --cpuset-cpus string         CPUs in which to allow execution (0-3, 0,1)
        --cpuset-mems string         MEMs in which to allow execution (0-3, 0,1)
        --kernel-memory bytes        Kernel memory limit
    -m, --memory bytes               Memory limit
        --memory-reservation bytes   Memory soft limit
        --memory-swap bytes          Swap limit equal to memory plus swap:
                                    '-1' to enable unlimited swap
        --pids-limit int             Tune container pids limit (set -1 for
                                    unlimited)
        --restart string             Restart policy to apply when a
                                    container exits


Python Docker SDK:
    https://docker-py.readthedocs.io/en/stable/
