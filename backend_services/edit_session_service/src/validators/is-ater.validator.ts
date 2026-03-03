import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as any)[relatedPropertyName];

        // Nếu update chỉ gửi 1 trong 2 field => bỏ qua (pass)
        if (value === undefined || value === null) return true;
        if (relatedValue === undefined || relatedValue === null) return true;

        const current = Number(value);
        const related = Number(relatedValue);

        if (Number.isNaN(current) || Number.isNaN(related)) return false;

        return current > related;
    }

    defaultMessage(args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        return `${args.property} must be greater than ${relatedPropertyName}`;
    }
}

export function IsAfter(
    relatedPropertyName: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [relatedPropertyName],
            validator: IsAfterConstraint,
        });
    };
}