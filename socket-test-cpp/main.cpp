#include <iostream>
#include <string>

#include <sys/socket.h>
#include <sys/un.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

auto ipc_connect(std::string path)
{
    const auto fd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (fd == -1) { throw std::runtime_error{"Invalid fd"}; }
    std::cout << "Connected to fd " << fd << '\n';

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, path.c_str(), sizeof(addr.sun_path) - 1);
    if (connect(fd, (struct sockaddr*)&addr, sizeof(addr)) == -1) { throw std::runtime_error{"Could not connect"}; }

    return [fd] (std::string data) {
        auto buffer = data + ";;;;";
        std::cout << "Sent the following packet: " << buffer << '\n';

        const auto length = buffer.length();
        if (write(fd, buffer.data(), length) != length) { throw std::runtime_error{"Invalid write size"}; }
    };
}

int main()
{
    const auto send = ipc_connect("../server.sock");
    send("{\"source\":\"slam\",\"timestamp\":1}");
    send("{\"source\":\"slams\",\"timestamp\":1}");
}
