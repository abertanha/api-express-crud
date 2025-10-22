import { SchemaOptions } from "mongoose";
import { SchemaDefinition } from "mongoose";
import { Schema } from "mongoose";
import { Time } from "../utilities/Time.ts";

export interface CustomSchemaOptions {
  docExpiresIn?: string
  createdAtOnly?: true
}

export abstract class BaseSchema {
    schema: Schema;
    constructor(
        schema: SchemaDefinition,
        options: CustomSchemaOptions & SchemaOptions = {},
    ) {
        const schemaOptions: SchemaOptions = {
            timestamps: true,
        }

        if (options.createdAtOnly) {
            schemaOptions.timestamps ={
                createdAt: true,
                updatedAt: false,
            }
        }

        Object.assign(schemaOptions, options);

        if (options.docExpiresIn) {
            Object.assign(schema, {
                createdAt: {
                    type: Date,
                    default: Time.now,
                    expires: options.docExpiresIn,
                },
            })
        }

        this.schema = new Schema(
            schema,
            schemaOptions,
        )

        // TODO
        // this.schema.plugin(aggregatePaginate);
    }
}