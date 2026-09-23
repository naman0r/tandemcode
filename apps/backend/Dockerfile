FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
# The base image ships a pip and setuptools with published advisories.
RUN pip install --no-cache-dir --upgrade pip setuptools \
    && pip install --no-cache-dir -r requirements.txt

# The runner starts one sandbox container per submission through the host's
# Docker socket. Only the client binary is needed, not the daemon.
ARG DOCKER_CLI_VERSION=27.5.1
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fsSL "https://download.docker.com/linux/static/stable/$(uname -m)/docker-${DOCKER_CLI_VERSION}.tgz" \
       | tar -xz --strip-components=1 -C /usr/local/bin docker/docker \
    && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY app ./app
COPY migrations ./migrations

RUN adduser --system --group --no-create-home app
USER app

EXPOSE 8080

# --ws-max-size caps a single websocket message well under uvicorn's 16 MB
# default; the relay rejects anything over 256 KB before that.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--ws-max-size", "1048576"]
