"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BraveSearchTool = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const axios_1 = __importDefault(require("axios"));
class BraveSearchTool {
    constructor() {
        this.description = {
            displayName: 'Brave Search Tool',
            name: 'braveSearchTool',
            icon: 'file:brave-logo-sans-text.svg',
            group: ['transform', 'output'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Make requests to Brave Search API',
            defaults: {
                name: 'Brave Search Tool',
            },
            inputs: ["main"],
            outputs: ["main"],
            usableAsTool: true,
            credentials: [
                {
                    name: 'braveSearchApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Web Search',
                            value: 'webSearch',
                            description: 'Perform a web search',
                            action: 'Perform a web search',
                        },
                    ],
                    default: 'webSearch',
                },
                {
                    displayName: 'Query',
                    name: 'query',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['webSearch'],
                        },
                    },
                    description: 'The search query to execute',
                },
                {
                    displayName: 'Additional Fields',
                    name: 'additionalFields',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    displayOptions: {
                        show: {
                            operation: ['webSearch'],
                        },
                    },
                    options: [
                        {
                            displayName: 'Country',
                            name: 'country',
                            type: 'string',
                            default: '',
                            description: 'Country code for search results (e.g., US, GB)',
                        },
                        {
                            displayName: 'Results Count',
                            name: 'count',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                                maxValue: 20,
                            },
                            default: 10,
                            description: 'Number of results to return (max: 20)',
                        },
                        {
                            displayName: 'Offset',
                            name: 'offset',
                            type: 'number',
                            typeOptions: {
                                minValue: 0,
                            },
                            default: 0,
                            description: 'Offset for pagination',
                        },
                        {
                            displayName: 'Safe Search',
                            name: 'safesearch',
                            type: 'options',
                            options: [
                                {
                                    name: 'Strict',
                                    value: 'strict',
                                },
                                {
                                    name: 'Moderate',
                                    value: 'moderate',
                                },
                                {
                                    name: 'Off',
                                    value: 'off',
                                },
                            ],
                            default: 'moderate',
                            description: 'Safe search setting',
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e;
        const items = this.getInputData();
        const returnData = [];
        let query = '';
        let params;
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                if (operation === 'webSearch') {
                    query = this.getNodeParameter('query', i);
                    const additionalFields = this.getNodeParameter('additionalFields', i);
                    const credentials = await this.getCredentials('braveSearchApi');
                    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.apiKey)) {
                        throw new Error('No API key provided in credentials');
                    }
                    params = {
                        q: query,
                        ...additionalFields,
                    };
                    try {
                        const response = await axios_1.default.get('https://api.search.brave.com/res/v1/web/search', {
                            params,
                            headers: {
                                'X-Subscription-Token': credentials.apiKey,
                                'Accept': 'application/json',
                            },
                        });
                        if (!response.data) {
                            throw new Error('Empty response from Brave Search API');
                        }
                        if (!response.data.web || !Array.isArray(response.data.web.results)) {
                            throw new Error(`Invalid response structure. Got: ${JSON.stringify(response.data)}`);
                        }
                        const responseData = {
                            ...response.data,
                            web: {
                                ...(response.data.web || {}),
                                results: response.data.web.results.map((result) => ({
                                    ...result,
                                    title: result.title || '',
                                    url: result.url || '',
                                    description: result.description || ''
                                }))
                            }
                        };
                        const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData), { itemData: { item: i } });
                        returnData.push(...executionData);
                    }
                    catch (error) {
                        if (axios_1.default.isAxiosError(error)) {
                            throw new Error(`API Request failed: ${error.message}. ` +
                                `Status: ${(_a = error.response) === null || _a === void 0 ? void 0 : _a.status}. ` +
                                `Response: ${JSON.stringify((_b = error.response) === null || _b === void 0 ? void 0 : _b.data)}`);
                        }
                        throw error;
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    const executionErrorData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray({
                        error: error.message,
                        details: ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || 'No additional error details available',
                        status: ((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) || 'Unknown status',
                        query: query || 'No query provided',
                        params: params || 'No params available'
                    }), { itemData: { item: i } });
                    returnData.push(...executionErrorData);
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Execution failed: ${error.message}`, {
                    description: ((_e = error.response) === null || _e === void 0 ? void 0 : _e.data)
                        ? `API Response: ${JSON.stringify(error.response.data)}`
                        : undefined,
                    itemIndex: i,
                });
            }
        }
        return [returnData];
    }
}
exports.BraveSearchTool = BraveSearchTool;
