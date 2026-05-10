import ts from "typescript";

function getExprLocation(sourceFile: ts.SourceFile, expr: ts.Expression) {
  const { line, character } = ts.getLineAndCharacterOfPosition(
    sourceFile,
    expr.getStart(sourceFile),
  );
  return `${sourceFile.fileName}:${line + 1}:${character + 1}`;
}

function unwrapExpression(e: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(e)) return unwrapExpression(e.expression);
  if (ts.isAsExpression(e)) return unwrapExpression(e.expression);
  if (ts.isTypeAssertionExpression(e)) return unwrapExpression(e.expression);
  if (ts.isSatisfiesExpression(e)) return unwrapExpression(e.expression);
  return e;
}

export function evalStaticTsExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile,
): unknown {
  const fail = (msg: string): never => {
    throw new Error(
      `Unsupported page.config.ts expression at ${getExprLocation(sourceFile, expr)}. ${msg}`,
    );
  };

  const node = unwrapExpression(expr);

  if (ts.isObjectLiteralExpression(node)) {
    const out: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop)) {
        fail("Spread assignments are not supported.");
      }
      if (!ts.isPropertyAssignment(prop)) {
        fail("Only property assignments are supported in config objects.");
        continue;
      }

      const name = prop.name;
      const keyOrNull = ts.isIdentifier(name)
        ? name.text
        : ts.isStringLiteral(name)
          ? name.text
          : ts.isNumericLiteral(name)
            ? name.text
            : null;

      if (keyOrNull === null) fail("Unsupported object key type.");
      const key = keyOrNull as string;
      out[key] = evalStaticTsExpression(prop.initializer, sourceFile);
    }
    return out;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((el) => evalStaticTsExpression(el, sourceFile));
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isIdentifier(node)) {
    if (node.text === "undefined") return undefined;
    fail(`Identifier "${node.text}" is not supported.`);
  }

  if (ts.isPrefixUnaryExpression(node)) {
    const v = evalStaticTsExpression(node.operand, sourceFile);
    if (typeof v !== "number") fail("Unary operators only supported on numbers.");
    const num = v as number;

    switch (node.operator) {
      case ts.SyntaxKind.MinusToken:
        return -num;
      case ts.SyntaxKind.PlusToken:
        return +num;
      default:
        fail("Only +/- unary operators are supported.");
    }
  }

  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) {
      const v = evalStaticTsExpression(span.expression, sourceFile);
      out += String(v ?? "");
      out += span.literal.text;
    }
    return out;
  }

  fail(`Unsupported expression kind: ${ts.SyntaxKind[node.kind]}`);
}

