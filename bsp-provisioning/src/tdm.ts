import { AxiosResponse } from "axios";
import { NepInfo } from ".";
import { sendRequest, ServerInfo } from "./etc";

/**
 * HTTP client for the TDM service.
 */
export class TdmClient {
    private server: ServerInfo;
    private headers: object = { "nep-service-version": "2:2" };

    constructor(
        public host: string,
        public port: number,
        public nepInfo: NepInfo,
        private ssl: boolean = true,
    ) {
        this.server = { host: this.host, port: this.port, ssl: this.ssl, nep: this.nepInfo };
    }

    /**
     * Submit a new transaction to TDM.
     *
     * @param xml - NAXML POS Journal containing the transaction.
     */
    submitTransaction<T = any>(xml: string): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            "transaction-document/transaction-documents?providerName=NAXML&providerVersion=1.0",
            "POST",
            xml,
            { "Content-Type": "text/xml", ...this.headers },
        );
    }

    /**
     * Get an existing transaction from TDM.
     *
     * @param id - Transaction's TDM ID.
     */
    getTransaction<T = any>(id: string): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `transaction-document/transaction-documents/${id}`,
            "GET",
            null,
            this.headers,
        );
    }

    /**
     * HTTP HEAD only: Get an existing transaction from TDM.
     *
     * @param id - Transaction's TDM ID.
     */
    async getTransactionHead<T = any>(id: string): Promise<AxiosResponse<T>> {
        return sendRequest<T>(
            this.server,
            `transaction-document/transaction-documents/${id}`,
            "HEAD",
            null,
            this.headers,
        );
    }
}
