/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { CreateAccountRequest } from '../models/CreateAccountRequest';
import type { CreateTransactionRequest } from '../models/CreateTransactionRequest';
import type { SyncStats } from '../models/SyncStats';
import type { Transaction } from '../models/Transaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HandlersService {
    /**
     * Get all accounts
     * @returns Account List of all accounts
     * @throws ApiError
     */
    public static getAccounts(): CancelablePromise<Array<Account>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Create a new account
     * @param requestBody
     * @returns Account Account created successfully
     * @throws ApiError
     */
    public static createAccount(
        requestBody: CreateAccountRequest,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get account by ID
     * @param id Account ID
     * @returns Account Account found
     * @throws ApiError
     */
    public static getAccount(
        id: string,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Account not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get transactions for an account
     * @param id Account ID
     * @returns Transaction List of transactions
     * @throws ApiError
     */
    public static getAccountTransactions(
        id: string,
    ): CancelablePromise<Array<Transaction>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/{id}/transactions',
            path: {
                'id': id,
            },
            errors: {
                404: `Account not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Trigger manual sync with SimpleFin
     * @returns SyncStats Sync completed successfully
     * @throws ApiError
     */
    public static triggerSync(): CancelablePromise<SyncStats> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sync',
            errors: {
                500: `Sync failed`,
            },
        });
    }
    /**
     * Create a new transaction
     * @param requestBody
     * @returns Transaction Transaction created successfully
     * @throws ApiError
     */
    public static createTransaction(
        requestBody: CreateTransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
                500: `Internal server error`,
            },
        });
    }
}
