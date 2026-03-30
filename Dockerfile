# Estágio 1: Build (Compila o código)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Primeiro, copia apenas o pom.xml para baixar as dependências (cache otimizado)
COPY pom.xml .
RUN mvn dependency:go-offline

# Depois, copia todo o código-fonte
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Run (Cria a imagem final leve)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copia o jar gerado no estágio de build
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]