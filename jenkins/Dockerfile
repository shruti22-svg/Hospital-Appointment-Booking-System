FROM jenkins/jenkins:lts-jdk17

USER root

COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
RUN mkdir -p /usr/local/lib/docker/cli-plugins
COPY --from=docker:27-cli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose
RUN chmod +x /usr/local/bin/docker /usr/local/lib/docker/cli-plugins/docker-compose \
    && apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

COPY casc.yaml /var/jenkins_home/casc.yaml
ENV CASC_JENKINS_CONFIG=/var/jenkins_home/casc.yaml
ENV JAVA_OPTS=-Djenkins.install.runSetupWizard=false
