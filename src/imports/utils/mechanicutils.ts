import { Attribute, Mechanic, ObjectInfo, ObjectType } from '../../objectInfos';


// Utility to get mechanic data by name
export function getMechanicDataByName(name: string, type: ObjectType) {
	return ObjectInfo[type].datasetMap.get(name.toLowerCase());
}

// Utility to get all mechanics that have a name that starts with a certain string
export function getMechanicsByPrefix(prefix: string, type: ObjectType) {
	return ObjectInfo[type].dataset.filter((mechanic: Mechanic) => mechanic.name.some((name: string) => name.startsWith(prefix.toLowerCase())));
}

export function getAllAttributes(mechanic: Mechanic, type: ObjectType) {
	let attributes = mechanic.attributes;
	if (mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (!parentMechanic) {
			return attributes;
		}
		let parentMechanicAttributes = getAllAttributes(parentMechanic, type);
		const parentMechanicInheritableAttributes = parentMechanic.inheritable_attributes;
		if (parentMechanicInheritableAttributes) {
			parentMechanicAttributes = parentMechanicAttributes.filter((attr: Attribute) =>
				parentMechanicInheritableAttributes.includes(attr.name[0].toLowerCase())
			);
		}
		attributes = attributes.concat(parentMechanicAttributes);
	}
	return attributes;

}

// Utility to get attribute data by name
export function getAttributeDataByName(mechanic: Mechanic, attributeName: string, type: ObjectType) {
	const attribute = mechanic.attributes.find((attr: Attribute) => attr.name.includes(attributeName.toLowerCase()));
	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, type);
		}
	}
	return attribute;
}




function getInheritedAttributeDataByName(mechanic: Mechanic, attributeName: string, type: ObjectType) {

	let attribute = null;

	if (mechanic.inheritable_attributes) {
		if (mechanic.inheritable_attributes.includes(attributeName.toLowerCase())) {
			attribute = mechanic.attributes.find((attr: Attribute) => attr.name.includes(attributeName.toLowerCase()));
		}
	}
	else {
		attribute = mechanic.attributes.find((attr: Attribute) => attr.name.includes(attributeName.toLowerCase()));
	}

	if (!attribute && mechanic.extends) {
		const parentMechanic = getMechanicDataByClass(mechanic.extends, type);
		if (parentMechanic) {
			return getInheritedAttributeDataByName(parentMechanic, attributeName, type);
		}
	}
	return attribute;
}

// Utility to get mechanic data by class
function getMechanicDataByClass(name: string, type: ObjectType) {
	return ObjectInfo[type].datasetClassMap.get(name.toLowerCase());
}
