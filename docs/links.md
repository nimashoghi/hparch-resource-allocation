General info on contianer scheduling:
- https://engineering.squarespace.com/blog/2017/understanding-linux-container-scheduling

Linux Real-time scheduler:
- https://docs.docker.com/config/containers/resource_constraints/#configure-the-realtime-scheduler


CONFIG_RT_GROUP_SCHED - realtime scheduling (instead of the Completely Fair Scheduler used by default on Linux):
- https://www.kernel.org/doc/Documentation/scheduler/sched-rt-group.txt
- NICE(2) system call: http://man7.org/linux/man-pages/man2/nice.2.html

CONFIG_PREEMPT_RT - a patch to the Linux kernel to make it fully preemptible -- this is not necessary right now but might be worth it to look into in the future:
- https://rt.wiki.kernel.org/index.php/Frequently_Asked_Questions
- https://rt.wiki.kernel.org/index.php/CONFIG_PREEMPT_RT_Patch
- https://wiki.linuxfoundation.org/realtime/documentation/howto/applications/preemptrt_setup

Performance:
- https://pcp.io/index.html
