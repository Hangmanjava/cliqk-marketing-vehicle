FROM public.ecr.aws/lambda/nodejs:20

# Copy package files
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY src/ ${LAMBDA_TASK_ROOT}/src/

# Set the handler
CMD [ "src/lambda-handlers.handler" ]
