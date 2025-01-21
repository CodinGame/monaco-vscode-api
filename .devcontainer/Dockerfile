FROM ubuntu:noble-20240605

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update \
    && apt upgrade -y \
    && apt install -y curl git python3 python-is-python3 build-essential jq rsync libkrb5-dev libsecret-1-dev

RUN curl https://get.volta.sh | bash
ENV VOLTA_FEATURE_PNPM=1
ENV VOLTA_HOME "/root/.volta"
ENV PATH "$VOLTA_HOME/bin:$PATH"

RUN volta install node@22

